import { NextRequest, NextResponse } from 'next/server'
import { canEditHub, getHub, getMeta } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'
import { describeAsset } from '@/lib/vision'
import { extensionOf } from '@/lib/uploads'

/**
 * Name/tag suggestions for a file that was uploaded straight to blob storage
 * and so never passed through this app.
 */
export async function POST(req: NextRequest) {
  let url: string, name: string, slug: string
  try {
    ({ url, name, slug } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const hub = await getHub(String(slug || ''))
  const meta = await getMeta(String(slug || ''))
  const user = await getSessionUser()
  if (!hub || !canEditHub(meta, user)) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }
  // Only describe files this app just stored — never an arbitrary URL.
  if (!/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(String(url))) {
    return NextResponse.json({ suggestion: null })
  }

  const suggestion = await describeAsset({ kind: 'url', url, ext: extensionOf(url) }, String(name || 'file'))
  return NextResponse.json({ suggestion })
}
