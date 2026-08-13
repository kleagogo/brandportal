import { NextResponse } from 'next/server'
import { ALLOWED_EXT, blobEnabled, maxUploadBytes, serverUploadLimit } from '@/lib/uploads'

/** What the uploader in the browser needs to know before picking a route. */
export async function GET() {
  const direct = serverUploadLimit()
  return NextResponse.json({
    blob: blobEnabled(),
    directLimit: direct,
    maxBytes: blobEnabled() ? maxUploadBytes() : direct,
    allowed: [...ALLOWED_EXT],
  })
}
