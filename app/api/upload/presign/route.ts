import { NextRequest, NextResponse } from 'next/server'
import { canEditHub, getHub, getMeta } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'
import { r2Enabled, r2PresignUpload } from '@/lib/r2'
import { ALLOWED_EXT, MIME, extensionOf, maxUploadBytes, storageName } from '@/lib/uploads'

/**
 * Hands the browser a short-lived URL for uploading one file straight to R2.
 *
 * The file never passes through this app, so size is limited by the plan
 * rather than by a request-body cap. Only someone who may already edit the
 * hub gets a URL, and it's scoped to a single generated key.
 */
export async function POST(req: NextRequest) {
  if (!r2Enabled()) {
    return NextResponse.json({ error: 'Direct uploads aren’t configured on this deployment' }, { status: 501 })
  }

  let filename: string, slug: string, size: number
  try {
    ({ filename, slug, size } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const hub = await getHub(String(slug || ''))
  const meta = await getMeta(String(slug || ''))
  const user = await getSessionUser()
  if (!hub || !canEditHub(meta, user)) {
    return NextResponse.json({ error: 'You don’t have permission to upload to this hub' }, { status: 403 })
  }

  const ext = extensionOf(String(filename || ''))
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: `File type .${ext || '?'} is not supported` }, { status: 415 })
  }
  if (Number(size) > maxUploadBytes()) {
    return NextResponse.json({ error: 'That file is larger than this deployment allows' }, { status: 413 })
  }

  const key = storageName(String(filename))
  const contentType = MIME[ext] || 'application/octet-stream'
  const uploadUrl = await r2PresignUpload(key, contentType)

  return NextResponse.json({
    uploadUrl,
    contentType,
    key,
    // Stable app URL; /api/files redirects to the CDN for the actual bytes.
    url: `/api/files/${key}`,
    format: ext.toUpperCase(),
  })
}
