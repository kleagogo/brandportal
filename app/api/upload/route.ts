import { NextRequest, NextResponse } from 'next/server'
import { canEditHub, getHub, getMeta } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'
import { getStorage } from '@/lib/db'
import { describeAsset } from '@/lib/vision'
import { ALLOWED_EXT, blobEnabled, extensionOf, humanSize, serverUploadLimit, storageName } from '@/lib/uploads'
import { r2DirectUploads } from '@/lib/r2'
import { quotaState } from '@/lib/quota'

/**
 * Direct upload — the file is posted here and stored by the driver.
 *
 * Serverless hosts cap request bodies, so anything larger than the server
 * limit goes through /api/upload/blob instead.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file')
  const slug = String(form.get('slug') || '')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Uploads always belong to a real hub — only its editors may add files.
  // (getMeta defaults unknown slugs to an open demo, so check existence first.)
  const hub = await getHub(slug)
  const meta = await getMeta(slug)
  const user = await getSessionUser()
  if (!hub || !canEditHub(meta, user)) {
    return NextResponse.json({ error: 'You don’t have permission to upload to this hub' }, { status: 403 })
  }
  const limit = serverUploadLimit()
  if (file.size > limit) {
    return NextResponse.json({
      error: blobEnabled() || r2DirectUploads()
        ? `Files over ${humanSize(limit)} upload straight to storage. Reload the page and try again.`
        : `File is too large (max ${humanSize(limit)}). Connect object storage to upload bigger files.`,
    }, { status: 413 })
  }

  // Refused before the bytes are stored, and named in the units the hub shows,
  // so "why did this fail" and "what do I delete" have the same answer.
  const quota = quotaState(hub)
  if (file.size > quota.remaining) {
    return NextResponse.json({
      error: `${humanSize(file.size)} won’t fit — this hub has ${humanSize(quota.remaining)} left of ${humanSize(quota.quota)}.`,
    }, { status: 507 })
  }

  const ext = extensionOf(file.name)
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: `File type .${ext || '?'} is not supported` }, { status: 415 })
  }

  const filename = storageName(file.name)
  const buffer = Buffer.from(await file.arrayBuffer())
  await getStorage().putFile(filename, buffer)

  const suggestion = await describeAsset({ kind: 'buffer', buffer, ext }, file.name)

  return NextResponse.json({
    // Always an app URL — /api/files redirects to the CDN when R2 is on.
    url: `/api/files/${filename}`,
    originalName: file.name,
    format: ext.toUpperCase(),
    size: file.size,
    bytes: file.size,
    ...(suggestion ? { suggestion } : {}),
  })
}
