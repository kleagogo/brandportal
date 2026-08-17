import { NextRequest, NextResponse } from 'next/server'
import { createToken } from '@/lib/tokens'
import { sendMagicLink } from '@/lib/email'
import { isValidEmail, normalizeEmail } from '@/lib/users'
import { allow, clientIp } from '@/lib/ratelimit'

/**
 * Request a sign-in magic link. Responds with { sent } when email went out, or
 * { devLink } when no email provider is configured (the UI shows the link
 * directly).
 */
export async function POST(req: NextRequest) {
  let body: { email?: string; redirect?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = normalizeEmail(body.email || '')
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  }

  if (!allow(`auth:${clientIp(req)}`, 10, 15 * 60_000) || !allow(`auth:${email}`, 5, 15 * 60_000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 })
  }

  const redirect = typeof body.redirect === 'string' && body.redirect.startsWith('/') ? body.redirect : undefined

  // Issuing a link touches storage. On an unconfigured deployment that throws,
  // and an uncaught throw here becomes an empty 500 the browser can't parse —
  // so say what's actually wrong instead.
  let token: string
  try {
    token = await createToken({ purpose: 'login', email, redirect })
  } catch (err) {
    console.error('[auth] Could not issue a sign-in token:', err)
    return NextResponse.json(
      { error: 'Sign-in is unavailable. This deployment has no database configured (see /api/health).' },
      { status: 503 },
    )
  }

  const url = `${req.nextUrl.origin}/api/auth/verify?token=${token}`
  const result = await sendMagicLink({ to: email, url, kind: 'login' })
  // A link that couldn't be delivered is a failure, not a quiet success.
  if (result.error) return NextResponse.json({ error: result.error }, { status: 502 })
  return NextResponse.json(result)
}
