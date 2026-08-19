import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createCheckout, polarConfigured, type PaidPlan } from '@/lib/polar'

/**
 * Start paying. The checkout is created per signed-in account and carries its
 * id, so the payment can never land on the wrong person — which is the whole
 * reason this exists instead of a static payment link.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  if (!polarConfigured()) {
    return NextResponse.json({ error: 'Billing isn’t switched on yet' }, { status: 503 })
  }

  const { plan } = await req.json().catch(() => ({ plan: '' }))
  if (plan !== 'pro' && plan !== 'studio') {
    return NextResponse.json({ error: 'Unknown plan' }, { status: 400 })
  }

  const origin = new URL(req.url).origin
  try {
    const { url } = await createCheckout({
      plan: plan as PaidPlan,
      userId: user.id,
      email: user.email,
      successUrl: `${origin}/settings?upgraded=1`,
    })
    return NextResponse.json({ url })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Couldn’t start the checkout' }, { status: 502 })
  }
}
