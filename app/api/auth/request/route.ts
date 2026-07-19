import { NextRequest, NextResponse } from 'next/server'
import { createToken } from '@/lib/tokens'
import { sendMagicLink } from '@/lib/email'
import { isValidEmail, normalizeEmail } from '@/lib/users'
import { getPreview } from '@/lib/store'
import { allow, clientIp } from '@/lib/ratelimit'

/**
 * Request a magic link — for signing in, or for claiming a preview hub.
 * Responds with { sent } when email went out, or { devLink } when no email
 * provider is configured (the UI shows the link directly).
 */
export async function POST(req: NextRequest) {
  let body: { email?: string; previewId?: string; redirect?: string }
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
    return NextResponse.json({ error: 'Too many attempts — try again in a few minutes' }, { status: 429 })
  }

  const claiming = typeof body.previewId === 'string' && body.previewId.length > 0
  let hubName: string | undefined
  if (claiming) {
    const preview = await getPreview(body.previewId!)
    if (!preview) {
      return NextResponse.json({ error: 'This preview has expired — scan your site again' }, { status: 410 })
    }
    hubName = preview.name
  }

  const redirect = typeof body.redirect === 'string' && body.redirect.startsWith('/') ? body.redirect : undefined
  const token = await createToken({
    purpose: claiming ? 'claim' : 'login',
    email,
    previewId: claiming ? body.previewId : undefined,
    redirect,
  })

  const url = `${req.nextUrl.origin}/api/auth/verify?token=${token}`
  const result = await sendMagicLink({ to: email, url, kind: claiming ? 'claim' : 'login', hubName })
  return NextResponse.json(result)
}
