import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, SESSION_COOKIE } from '@/lib/auth'
import { deleteUser, isValidEmail, getUserByEmail, normalizeEmail } from '@/lib/users'
import { deleteHubsOwnedBy, listHubsForUser, removeEditorEverywhere } from '@/lib/store'
import { createToken } from '@/lib/tokens'
import { sendMagicLink } from '@/lib/email'

/** The signed-in user's account: profile, email change, hub memberships, deletion. */

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const hubs = await listHubsForUser(user)
  return NextResponse.json({
    email: user.email,
    plan: user.plan || 'free',
    createdAt: user.createdAt,
    hubs: hubs.map(({ hub, role }) => ({ slug: hub.slug, name: hub.name, role })),
  })
}

/** Request an email change — a confirmation link goes to the NEW address. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  let newEmail: string
  try {
    ({ newEmail } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  newEmail = normalizeEmail(newEmail || '')
  if (!isValidEmail(newEmail)) return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  if (newEmail === user.email) return NextResponse.json({ error: 'That’s already your email' }, { status: 400 })
  if (await getUserByEmail(newEmail)) return NextResponse.json({ error: 'That email already has an account' }, { status: 400 })

  const token = await createToken({ purpose: 'email-change', email: newEmail, userId: user.id })
  const url = `${req.nextUrl.origin}/api/auth/verify?token=${token}`
  const result = await sendMagicLink({ to: newEmail, url, kind: 'login' })
  return NextResponse.json(result)
}

/** Delete the account: owned hubs are removed, editor access revoked. */
export async function DELETE() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  await deleteHubsOwnedBy(user.id)
  await removeEditorEverywhere(user.email)
  await deleteUser(user.id)

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
