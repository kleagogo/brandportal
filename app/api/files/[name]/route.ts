import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { getStorage } from '@/lib/db'
import { MIME, extensionOf } from '@/lib/uploads'
import { r2Enabled, r2PresignDownload, r2PublicUrl } from '@/lib/r2'

/**
 * Serves an uploaded file.
 *
 * Every asset in a hub points here, so the URL never changes when storage
 * does. With R2 behind it the request is redirected to Cloudflare, which
 * means the bytes come off the CDN — fast for the viewer, and no egress bill.
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
    // A download needs the attachment header, which only a signed URL carries.
    const target = download
      ? await r2PresignDownload(safe, safe)
      : r2PublicUrl(safe) || await r2PresignDownload(safe)
    return NextResponse.redirect(target, 307)
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
