import { NextRequest, NextResponse } from 'next/server'
import { getMeta } from '@/lib/store'
import { pinCookieName, pinCookieValue } from '@/lib/auth'

/** Viewers unlock a PIN-protected hub here; success sets a per-hub cookie. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  let pin: string
  try {
    ({ pin } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const meta = await getMeta(slug)
  if (!meta.pin) return NextResponse.json({ ok: true }) // hub is public

  if (String(pin).trim() !== meta.pin) {
    return NextResponse.json({ error: 'Wrong PIN — check with whoever shared the link' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(pinCookieName(slug), await pinCookieValue(slug, meta.pin), {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.nextUrl.protocol === 'https:',
    maxAge: 30 * 24 * 3600,
    path: `/`,
  })
  return res
}
