import { NextResponse } from 'next/server'
import { ALLOWED_EXT, blobEnabled, maxUploadBytes, serverUploadLimit } from '@/lib/uploads'
import { r2DirectUploads, r2Enabled } from '@/lib/r2'

/** What the uploader in the browser needs to know before picking a route. */
export async function GET() {
  const direct = serverUploadLimit()
  const bigUploads = r2DirectUploads() || blobEnabled()
  return NextResponse.json({
    r2: r2DirectUploads(),
    blob: blobEnabled(),
    directLimit: direct,
    maxBytes: bigUploads ? maxUploadBytes() : direct,
    allowed: [...ALLOWED_EXT],
  })
}
