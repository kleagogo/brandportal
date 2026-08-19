import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { getUserByEmail, setBilling } from '@/lib/users'

/**
 * Give an account a plan by hand — the "code for a free signup" without a
 * code: no card, no checkout, no expiry surprise. Admin-only; for everyone
 * else this route doesn't exist.
 */
export async function POST(req: NextRequest) {
  const admin = await getSessionUser()
  if (!isAdmin(admin)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { email, plan } = await req.json().catch(() => ({}))
  if (plan !== 'free' && plan !== 'pro' && plan !== 'studio') {
    return NextResponse.json({ error: 'Unknown plan' }, { status: 400 })
  }
  const target = await getUserByEmail(String(email || ''))
  if (!target) {
    return NextResponse.json({ error: 'No account with that email — they need to sign up first' }, { status: 404 })
  }

  // Setting a paying customer to Free here wouldn't stop the charges — the
  // subscription lives at Polar, and its next renewal event would flip the
  // plan straight back. Cancel it where it lives.
  const live = target.subscriptionStatus && target.subscriptionStatus !== 'granted'
  if (plan === 'free' && live) {
    return NextResponse.json({
      error: 'They have a live subscription. Cancel it in Polar — the plan follows automatically.',
    }, { status: 409 })
  }

  await setBilling(target.id, {
    plan,
    // Hand-granted: no subscription behind it, so no status to report.
    subscriptionStatus: plan === 'free' ? undefined : 'granted',
    subscriptionEndsAt: undefined,
  })
  return NextResponse.json({ email: target.email, plan })
}
