import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { getStorage } from '@/lib/db'
import { MIME, extensionOf } from '@/lib/uploads'
import { r2DirectUploads, r2Enabled, r2PresignDownload, r2PublicUrl } from '@/lib/r2'

/**
 * Serves an uploaded file.
 *
 * Every asset in a hub points here, so the URL never changes when storage
 * does. When the bytes can be reached by a public bucket domain or a signed
 * URL, the request is redirected so they come off Cloudflare's CDN — fast for
 * the viewer, and no egress bill. A bucket reachable only through the Worker
 * binding has neither, so those bytes are streamed back from here instead.
 * Add ?dl=1 to save rather than open.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  const safe = path.basename(name) // strips any path traversal
  const download = req.nextUrl.searchParams.has('dl')

  if (r2Enabled()) {
    // A download needs the attachment header, which only a signed URL carries
    // — and signing needs the S3 keys, so it isn't always on offer.
    const target = download
      ? (r2DirectUploads() ? await r2PresignDownload(safe, safe) : null)
      : r2PublicUrl(safe) || (r2DirectUploads() ? await r2PresignDownload(safe) : null)
    if (target) return NextResponse.redirect(target, 307)
    // Otherwise fall through and serve the bytes ourselves, reading them back
    // out of R2 through the binding.
  }

  const data = await getStorage().getFile(safe)
  if (!data) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  const headers: Record<string, string> = {
    'Content-Type': MIME[extensionOf(safe)] || 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000, immutable',
  }
  if (download) headers['Content-Disposition'] = `attachment; filename="${safe}"`
  return new NextResponse(new Uint8Array(data), { headers })
}
