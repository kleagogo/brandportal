/**
 * Cloudflare R2 — where uploaded files live once it's configured.
 *
 * R2 speaks S3, so this is plain SigV4-signed fetch (aws4fetch, ~7KB) rather
 * than the AWS SDK: it runs identically on Node and on Workers, and keeps the
 * Worker bundle small. Two reasons R2 is the right home for brand assets:
 * downloads cost nothing (no egress fees), and files can be served straight
 * off Cloudflare's CDN instead of being proxied through the app.
 *
 * Env:
 *   R2_ACCOUNT_ID          from the Cloudflare dashboard
 *   R2_ACCESS_KEY_ID       R2 API token, "Object Read & Write"
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET              e.g. basel-assets
 *   R2_PUBLIC_BASE         optional, e.g. https://assets.yourdomain.com —
 *                          when set, viewers download straight from the CDN
 */

import { AwsClient } from 'aws4fetch'

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

let cached: { client: AwsClient; config: R2Config } | null = null

function connect(): { client: AwsClient; config: R2Config } {
  const config = r2Config()
  if (!config) throw new Error('R2 is not configured')
  if (!cached || cached.config.bucket !== config.bucket) {
    cached = {
      config,
      client: new AwsClient({
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        service: 's3',
        region: 'auto',
      }),
    }
  }
  return cached
}

function objectUrl(config: R2Config, name: string): string {
  return `https://${config.bucket}.${config.accountId}.r2.cloudflarestorage.com/${encodeURIComponent(name)}`
}

export async function r2Get(name: string): Promise<Buffer | null> {
  try {
    const { client, config } = connect()
    const res = await client.fetch(objectUrl(config, name))
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null // missing object, or R2 is having a moment
  }
}

export async function r2Put(name: string, data: Buffer, contentType?: string): Promise<void> {
  const { client, config } = connect()
  const res = await client.fetch(objectUrl(config, name), {
    method: 'PUT',
    body: new Uint8Array(data),
    headers: contentType ? { 'Content-Type': contentType } : {},
  })
  if (!res.ok) throw new Error(`R2 rejected the upload (${res.status})`)
}

export async function r2Delete(name: string): Promise<void> {
  try {
    const { client, config } = connect()
    await client.fetch(objectUrl(config, name), { method: 'DELETE' })
  } catch { /* deleting a file that isn't there is fine */ }
}

/** Sign a URL that carries its own credentials in the query string. */
async function presign(name: string, method: 'PUT' | 'GET', expiresIn: number, params: Record<string, string> = {}): Promise<string> {
  const { client, config } = connect()
  const url = new URL(objectUrl(config, name))
  url.searchParams.set('X-Amz-Expires', String(expiresIn))
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  const signed = await client.sign(url.toString(), { method, aws: { signQuery: true } })
  return signed.url
}

/**
 * A short-lived URL the browser can PUT one file to, so big uploads never pass
 * through the app (and never meet a serverless request-body limit).
 */
export function r2PresignUpload(name: string, _contentType: string, expiresIn = 600): Promise<string> {
  return presign(name, 'PUT', expiresIn)
}

/**
 * A short-lived URL for reading one file, optionally as a download.
 *
 * Used when there's no public domain, or when a file should save rather than
 * open in a tab — either way the bytes come from Cloudflare, not from here.
 */
export function r2PresignDownload(name: string, downloadAs?: string): Promise<string> {
  return presign(name, 'GET', 3600, downloadAs
    ? { 'response-content-disposition': `attachment; filename="${downloadAs}"` }
    : {})
}
