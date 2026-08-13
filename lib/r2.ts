/**
 * Cloudflare R2 — where uploaded files live once it's configured.
 *
 * R2 speaks S3, so this is the AWS SDK pointed at Cloudflare. Two reasons it's
 * the right home for brand assets: downloads don't cost anything (no egress
 * fees), and files can be served straight off Cloudflare's CDN instead of
 * being proxied through the app.
 *
 * Env:
 *   R2_ACCOUNT_ID          from the Cloudflare dashboard
 *   R2_ACCESS_KEY_ID       R2 API token, "Object Read & Write"
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET              e.g. basel-assets
 *   R2_PUBLIC_BASE         optional, e.g. https://assets.yourdomain.com —
 *                          when set, viewers download straight from the CDN
 */

import type { GetObjectCommandOutput } from '@aws-sdk/client-s3'

export interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicBase?: string
}

export function r2Config(): R2Config | null {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE } = process.env
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) return null
  return {
    accountId: R2_ACCOUNT_ID,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    bucket: R2_BUCKET,
    publicBase: R2_PUBLIC_BASE?.replace(/\/+$/, ''),
  }
}

export function r2Enabled(): boolean {
  return r2Config() !== null
}

/** The URL a viewer should use, or null when files must be proxied by the app. */
export function r2PublicUrl(name: string): string | null {
  const config = r2Config()
  if (!config?.publicBase) return null
  return `${config.publicBase}/${encodeURIComponent(name)}`
}

type S3Module = typeof import('@aws-sdk/client-s3')

let cached: { client: InstanceType<S3Module['S3Client']>; mod: S3Module; config: R2Config } | null = null

async function connect() {
  const config = r2Config()
  if (!config) throw new Error('R2 is not configured')
  if (!cached) {
    const mod = await import('@aws-sdk/client-s3')
    const client = new mod.S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    })
    cached = { client, mod, config }
  }
  return cached
}

export async function r2Get(name: string): Promise<Buffer | null> {
  try {
    const { client, mod, config } = await connect()
    const res: GetObjectCommandOutput = await client.send(
      new mod.GetObjectCommand({ Bucket: config.bucket, Key: name })
    )
    if (!res.Body) return null
    return Buffer.from(await res.Body.transformToByteArray())
  } catch {
    return null // missing object, or R2 is having a moment
  }
}

export async function r2Put(name: string, data: Buffer, contentType?: string): Promise<void> {
  const { client, mod, config } = await connect()
  await client.send(new mod.PutObjectCommand({
    Bucket: config.bucket,
    Key: name,
    Body: data,
    ...(contentType ? { ContentType: contentType } : {}),
  }))
}

export async function r2Delete(name: string): Promise<void> {
  try {
    const { client, mod, config } = await connect()
    await client.send(new mod.DeleteObjectCommand({ Bucket: config.bucket, Key: name }))
  } catch { /* deleting a file that isn't there is fine */ }
}

/**
 * A short-lived URL for reading one file, optionally as a download.
 *
 * Used when there's no public domain, or when a file should save rather than
 * open in a tab — either way the bytes come from Cloudflare, not from here.
 */
export async function r2PresignDownload(name: string, downloadAs?: string): Promise<string> {
  const { client, mod, config } = await connect()
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
  return getSignedUrl(
    client,
    new mod.GetObjectCommand({
      Bucket: config.bucket,
      Key: name,
      ...(downloadAs ? { ResponseContentDisposition: `attachment; filename="${downloadAs}"` } : {}),
    }),
    { expiresIn: 3600 }
  )
}

/**
 * A short-lived URL the browser can PUT one file to, so big uploads never pass
 * through the app (and never meet a serverless request-body limit).
 */
export async function r2PresignUpload(name: string, contentType: string, expiresIn = 600): Promise<string> {
  const { client, mod, config } = await connect()
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
  return getSignedUrl(
    client,
    new mod.PutObjectCommand({ Bucket: config.bucket, Key: name, ContentType: contentType }),
    { expiresIn }
  )
}
