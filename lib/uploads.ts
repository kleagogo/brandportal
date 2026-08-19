/**
 * Upload rules, shared by the server routes and the browser.
 *
 * Small files go straight through the app (one request, works anywhere).
 * Anything bigger needs Vercel Blob: serverless hosts cap request bodies at
 * ~4.5MB, so big files are uploaded from the browser to blob storage with a
 * short-lived token this app hands out.
 */

import crypto from 'crypto'

/**
 * Largest file a plain POST to /api/upload can carry.
 *
 * Serverless hosts reject request bodies over ~4.5MB before the route ever
 * runs, so that's the real ceiling there. Running on your own box, the only
 * limit is what the storage driver is happy to hold.
 */
export function serverUploadLimit(): number {
  if (process.env.VERCEL) return 4 * 1024 * 1024
  // A multipart POST is read into memory to be parsed and copied again to be
  // stored, and a Worker isolate has 128MB for both plus the runtime. 100MB
  // was never deliverable here; anything bigger than this goes to
  // /api/upload/stream, which never holds the file at all.
  return Math.min(maxUploadBytes(), 24 * 1024 * 1024)
}

/** Largest file overall. Raise with UPLOAD_MAX_MB (blob storage only). */
export function maxUploadBytes(): number {
  const mb = Number(process.env.UPLOAD_MAX_MB)
  return (Number.isFinite(mb) && mb > 0 ? mb : 500) * 1024 * 1024
}

/** Is client-direct blob upload configured? */
export function blobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

export const ALLOWED_EXT = new Set([
  // images
  'svg', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'ico', 'avif', 'tif', 'tiff', 'heic', 'bmp',
  // documents
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'key', 'xls', 'xlsx', 'csv', 'txt', 'md', 'rtf',
  // design source files
  'ai', 'eps', 'psd', 'indd', 'idml', 'sketch', 'fig', 'xd', 'afdesign', 'afphoto', 'afpub',
  // motion and audio
  'mp4', 'mov', 'webm', 'gifv', 'mp3', 'wav', 'aif', 'aiff', 'aep', 'prproj', 'lottie', 'json',
  // fonts and archives
  'woff', 'woff2', 'otf', 'ttf', 'eot', 'zip', 'rar', '7z', 'tar', 'gz',
])

export const MIME: Record<string, string> = {
  svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  webp: 'image/webp', gif: 'image/gif', ico: 'image/x-icon', avif: 'image/avif',
  tif: 'image/tiff', tiff: 'image/tiff', heic: 'image/heic', bmp: 'image/bmp',
  pdf: 'application/pdf', txt: 'text/plain', md: 'text/markdown', csv: 'text/csv',
  rtf: 'application/rtf', json: 'application/json',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  key: 'application/vnd.apple.keynote',
  ai: 'application/postscript', eps: 'application/postscript',
  psd: 'image/vnd.adobe.photoshop', indd: 'application/x-indesign',
  mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
  mp3: 'audio/mpeg', wav: 'audio/wav', aif: 'audio/aiff', aiff: 'audio/aiff',
  woff: 'font/woff', woff2: 'font/woff2', otf: 'font/otf', ttf: 'font/ttf', eot: 'application/vnd.ms-fontobject',
  zip: 'application/zip', rar: 'application/vnd.rar', '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar', gz: 'application/gzip',
}

export function extensionOf(filename: string): string {
  return (filename.split('.').pop() || '').toLowerCase()
}

/** A safe, unique storage name derived from what the user uploaded. */
export function storageName(originalName: string): string {
  const ext = extensionOf(originalName)
  const base = (originalName.replace(/\.[^.]*$/, '') || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'file'
  // /api/files serves by name with no session check, so the name *is* the
  // capability: it has to be unguessable, not merely unique. Math.random and
  // four characters were neither secret nor long enough.
  const unique = crypto.randomBytes(12).toString('base64url')
  return `${base}-${unique}.${ext}`
}

/**
 * The storage key behind an asset URL, for files this app holds — whether
 * they're proxied (/api/files/x.png) or served from the CDN. Returns null for
 * genuinely external links.
 */
export function assetKey(fileUrl: string): string | null {
  if (fileUrl.startsWith('/api/files/')) {
    return decodeURIComponent(fileUrl.split('?')[0].slice('/api/files/'.length))
  }
  const base = process.env.R2_PUBLIC_BASE?.replace(/\/+$/, '')
  if (base && fileUrl.startsWith(`${base}/`)) {
    return decodeURIComponent(fileUrl.split('?')[0].slice(base.length + 1))
  }
  return null
}

export function humanSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / 1024 / 1024)}MB`
  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}
