import { NextRequest, NextResponse } from 'next/server'
import { canEditHub, getHub, getMeta } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'
import { getStorage } from '@/lib/db'
import { describeAsset } from '@/lib/vision'
import { extensionOf } from '@/lib/uploads'

/** Vision only reads images, and only ones worth the round trip. */
const INLINE_LIMIT = 4 * 1024 * 1024

/**
 * Name/tag suggestions for a file that went straight to storage and so never
 * passed through this app.
 */
export async function POST(req: NextRequest) {
  let key: string | undefined, url: string | undefined, name: string, slug: string
  try {
    ({ key, url, name, slug } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const hub = await getHub(String(slug || ''))
  const meta = await getMeta(String(slug || ''))
  const user = await getSessionUser()
  if (!hub || !canEditHub(meta, user)) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  // A key names a file this app just stored — read it back and look at it.
  if (key) {
    const safe = String(key).replace(/[^\w.\-]/g, '')
    const data = await getStorage().getFile(safe)
    if (!data || data.length > INLINE_LIMIT) return NextResponse.json({ suggestion: null })
    return NextResponse.json({
      suggestion: await describeAsset({ kind: 'buffer', buffer: data, ext: extensionOf(safe) }, String(name || safe)),
    })
  }

  // Vercel Blob hands back a public URL — never describe an arbitrary one.
  if (!/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(String(url))) {
    return NextResponse.json({ suggestion: null })
  }
  return NextResponse.json({
    suggestion: await describeAsset({ kind: 'url', url: String(url), ext: extensionOf(String(url)) }, String(name || 'file')),
  })
}
