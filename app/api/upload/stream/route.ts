import { NextRequest, NextResponse } from 'next/server'
import { canEditHub, getHub, getMeta } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'
import { ALLOWED_EXT, MIME, extensionOf, humanSize, maxUploadBytes, storageName } from '@/lib/uploads'
import { r2PutStream, r2StreamUploads } from '@/lib/r2'
import { quotaState } from '@/lib/quota'

/**
 * Upload without holding the file.
 *
 * /api/upload parses a multipart form, which reads the whole body into the
 * isolate, then copies it out again to hand to the storage driver. A Worker
 * isolate has 128MB, so that path could never deliver the 100MB the uploader
 * advertised — it died somewhere well short of it, with a runtime error
 * rather than anything a person could act on.
 *
 * Here the browser PUTs the file as the raw body and it goes straight into
 * the bucket as it arrives, so peak memory no longer tracks file size. The
 * name and hub travel as query parameters because there is no form to put
 * them in.
 *
 * No AI description comes back from this route: reading the file to describe
 * it would reintroduce exactly the buffering this exists to avoid. Nothing is
 * lost, since that pass already skips anything over 4MB.
 */
export async function PUT(req: NextRequest) {
  if (!r2StreamUploads()) {
    return NextResponse.json({ error: 'Streaming uploads are not configured' }, { status: 501 })
  }

  const { searchParams } = new URL(req.url)
  const slug = String(searchParams.get('slug') || '')
  const originalName = String(searchParams.get('name') || '')

  // Same gate as the buffered route: uploads belong to a real hub, and only
  // its editors may add to it.
  const hub = await getHub(slug)
  const meta = await getMeta(slug)
  const user = await getSessionUser()
  if (!hub || !canEditHub(meta, user)) {
    return NextResponse.json({ error: 'You don’t have permission to upload to this hub' }, { status: 403 })
  }

  const ext = extensionOf(originalName)
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: `File type .${ext || '?'} is not supported` }, { status: 415 })
  }

  const limit = maxUploadBytes()
  const declared = Number(req.headers.get('content-length') || 0)
  if (declared > limit) {
    return NextResponse.json({ error: `File is too large (max ${humanSize(limit)})` }, { status: 413 })
  }
  if (!req.body) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const quota = quotaState(hub)
  if (declared > quota.remaining) {
    return NextResponse.json({
      error: `${humanSize(declared)} won’t fit — this hub has ${humanSize(quota.remaining)} left of ${humanSize(quota.quota)}.`,
    }, { status: 507 })
  }

  const filename = storageName(originalName)
  try {
    await r2PutStream(filename, req.body, MIME[ext])
  } catch {
    return NextResponse.json({ error: `Couldn’t store ${originalName}` }, { status: 502 })
  }

  return NextResponse.json({
    url: `/api/files/${filename}`,
    originalName,
    format: ext.toUpperCase(),
    size: declared,
    bytes: declared,
  })
}
