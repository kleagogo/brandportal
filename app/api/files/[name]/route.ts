import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { getStorage } from '@/lib/db'

const MIME: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  ico: 'image/x-icon',
  pdf: 'application/pdf',
  zip: 'application/zip',
  eps: 'application/postscript',
  ai: 'application/postscript',
  mp4: 'video/mp4',
  woff: 'font/woff',
  woff2: 'font/woff2',
  otf: 'font/otf',
  ttf: 'font/ttf',
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  const safe = path.basename(name) // strips any path traversal

  const data = await getStorage().getFile(safe)
  if (!data) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  const ext = (safe.split('.').pop() || '').toLowerCase()
  const headers: Record<string, string> = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000, immutable',
  }
  if (req.nextUrl.searchParams.has('dl')) {
    headers['Content-Disposition'] = `attachment; filename="${safe}"`
  }
  return new NextResponse(new Uint8Array(data), { headers })
}
