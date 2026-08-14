/**
 * Cloudflare R2 — where uploaded files live once it's configured.
 *
 * Two reasons R2 is the right home for brand assets: downloads cost nothing
 * (no egress fees), and files can be served straight off Cloudflare's CDN
 * instead of being proxied through the app.
 *
 * There are two ways to reach the bucket, and the app takes whichever it has:
 *  - A Worker binding (`r2_buckets` in wrangler.jsonc). Nothing to configure
 *    beyond the binding itself, and no credentials to leak or rotate.
 *  - The S3 API, SigV4-signed with aws4fetch (~7KB, no AWS SDK). This is the
 *    only way to presign a URL, which is what lets the browser send a large
 *    file straight to R2 without it passing through the app.
 *
 * So the two questions are answered separately: r2Enabled() means "files can
 * live in R2", r2DirectUploads() means "the browser can talk to R2 itself".
 *
 * Env:
 *   R2_ACCOUNT_ID          from the Cloudflare dashboard
 *   R2_ACCESS_KEY_ID       R2 API token, "Object Read & Write"
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET              e.g. pitho-assets
 *   R2_PUBLIC_BASE         optional, e.g. https://assets.yourdomain.com —
 *                          when set, viewers download straight from the CDN
 */

import { AwsClient } from 'aws4fetch'
import { getCloudflareContext } from '@opennextjs/cloudflare'

/** The slice of Cloudflare's R2Bucket this app actually uses. */
interface R2BucketBinding {
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>
  delete(key: string): Promise<void>
}

/**
 * The bound bucket, when running on Workers with `r2_buckets` configured.
 * There's no Cloudflare context under `next dev` or at build time, so a
 * missing binding is an ordinary state here rather than a failure.
 */
function bucketBinding(): R2BucketBinding | null {
  try {
    const env = getCloudflareContext().env as unknown as { ASSETS_BUCKET?: R2BucketBinding }
    return env.ASSETS_BUCKET ?? null
  } catch {
    return null
  }
}

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

/** Can uploaded files live in R2 — whether by binding or by API keys? */
export function r2Enabled(): boolean {
  return bucketBinding() !== null || r2Config() !== null
}

/**
 * Can the browser reach R2 without going through the app? Presigning is an
 * S3-API trick, so a binding alone doesn't grant it — uploads fall back to
 * being posted here and forwarded on.
 */
export function r2DirectUploads(): boolean {
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
  const bucket = bucketBinding()
  if (bucket) {
    try {
      const object = await bucket.get(name)
      return object ? Buffer.from(await object.arrayBuffer()) : null
    } catch {
      return null
    }
  }
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
  const bucket = bucketBinding()
  if (bucket) {
    const body = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
    await bucket.put(name, body, contentType ? { httpMetadata: { contentType } } : undefined)
    return
  }
  const { client, config } = connect()
  const res = await client.fetch(objectUrl(config, name), {
    method: 'PUT',
    body: new Uint8Array(data),
    headers: contentType ? { 'Content-Type': contentType } : {},
  })
  if (!res.ok) throw new Error(`R2 rejected the upload (${res.status})`)
}

export async function r2Delete(name: string): Promise<void> {
  const bucket = bucketBinding()
  if (bucket) {
    await bucket.delete(name).catch(() => {})
    return
  }
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
