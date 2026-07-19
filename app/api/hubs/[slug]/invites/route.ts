import { NextRequest, NextResponse } from 'next/server'
import { getHub, getMeta, isHubOwner } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'
import { createToken, listTokensForSlug } from '@/lib/tokens'
import { sendMagicLink } from '@/lib/email'
import { isValidEmail, normalizeEmail } from '@/lib/users'
import { limitsFor } from '@/lib/limits'

/** Owner invites an editor by email. The invite is a magic link. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const meta = await getMeta(slug)
  const user = await getSessionUser()
  if (!isHubOwner(meta, user)) {
    return NextResponse.json({ error: 'Only the owner can invite editors' }, { status: 403 })
  }

  let email: string
  try {
    ({ email } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  email = normalizeEmail(email || '')
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  }
  if (email === user!.email) {
    return NextResponse.json({ error: 'That’s you — you already own this hub' }, { status: 400 })
  }
  if (meta.editors.includes(email)) {
    return NextResponse.json({ error: 'That person can already edit this hub' }, { status: 400 })
  }
  // Accepted editors + outstanding invites both count toward the seat limit.
  const pending = (await listTokensForSlug(slug)).filter(t => t.purpose === 'invite')
  if (pending.some(t => t.email === email)) {
    return NextResponse.json({ error: 'That person already has a pending invite' }, { status: 400 })
  }
  const limits = limitsFor(user!)
  if (meta.editors.length + pending.length >= limits.editorsPerHub) {
    return NextResponse.json({ error: `Your plan allows ${limits.editorsPerHub} editors per hub — Pro (coming soon) raises the limit` }, { status: 403 })
  }

  const hub = await getHub(slug)
  const token = await createToken({ purpose: 'invite', email, slug })
  const url = `${req.nextUrl.origin}/api/auth/verify?token=${token}`
  const result = await sendMagicLink({ to: email, url, kind: 'invite', hubName: hub?.name })

  return NextResponse.json({ ...result, email })
}
