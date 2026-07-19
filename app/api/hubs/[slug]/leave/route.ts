import { NextRequest, NextResponse } from 'next/server'
import { getMeta, saveMeta } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'

/** An editor removes themself from a hub. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const meta = await getMeta(slug)
  if (!meta.editors.includes(user.email)) {
    return NextResponse.json({ error: 'You’re not an editor of this hub' }, { status: 400 })
  }
  await saveMeta({ ...meta, editors: meta.editors.filter(e => e !== user.email) })
  return NextResponse.json({ ok: true })
}
