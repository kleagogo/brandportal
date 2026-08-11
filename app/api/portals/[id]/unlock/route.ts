import { NextRequest, NextResponse } from 'next/server'
import { getPortal } from '@/lib/store'
import { portalCookieName, portalCookieValue } from '@/lib/auth'

/** Viewers unlock a password-protected share portal here. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let password: string
  try {
    ({ password } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const portal = await getPortal(id)
  if (!portal) return NextResponse.json({ error: 'Share link not found' }, { status: 404 })
  if (!portal.password) return NextResponse.json({ ok: true }) // portal is open

  if (String(password).trim() !== portal.password) {
    return NextResponse.json({ error: 'Wrong password — check with whoever shared the link' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(portalCookieName(id), await portalCookieValue(id, portal.password), {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.nextUrl.protocol === 'https:',
    maxAge: 30 * 24 * 3600,
    path: '/',
  })
  return res
}
