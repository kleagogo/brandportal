import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { getStorage } from '@/lib/db'
import { MIME, extensionOf } from '@/lib/uploads'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  const safe = path.basename(name) // strips any path traversal

  const data = await getStorage().getFile(safe)
  if (!data) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  const headers: Record<string, string> = {
    'Content-Type': MIME[extensionOf(safe)] || 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000, immutable',
  }
  if (req.nextUrl.searchParams.has('dl')) {
    headers['Content-Disposition'] = `attachment; filename="${safe}"`
  }
  return new NextResponse(new Uint8Array(data), { headers })
}
