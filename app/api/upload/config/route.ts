import { NextResponse } from 'next/server'
import { ALLOWED_EXT, blobEnabled, maxUploadBytes, serverUploadLimit } from '@/lib/uploads'
import { r2DirectUploads, r2StreamUploads } from '@/lib/r2'

/** What the uploader in the browser needs to know before picking a route. */
export async function GET() {
  const direct = serverUploadLimit()
  const stream = r2StreamUploads()
  const bigUploads = r2DirectUploads() || blobEnabled() || stream
  return NextResponse.json({
    r2: r2DirectUploads(),
    stream,
    blob: blobEnabled(),
    // What a multipart POST can carry. Both the parse and the copy out of it
    // live in a 128MB isolate, so this stays well under a third of that.
    directLimit: direct,
    maxBytes: bigUploads ? maxUploadBytes() : direct,
    allowed: [...ALLOWED_EXT],
  })
}
