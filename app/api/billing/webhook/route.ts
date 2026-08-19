import { NextRequest, NextResponse } from 'next/server'
import { planForProduct, statusEntitles, verifyWebhook } from '@/lib/polar'
import { getUserById, setBilling } from '@/lib/users'

/**
 * Polar telling us money moved.
 *
 * Subscription events carry the account id we stamped on the checkout
 * (external id), the product, and a status — that's everything needed to set
 * the plan. Unsigned requests are discarded before they're even parsed: this
 * endpoint is otherwise an open door to free Pro plans.
 *
 * Handlers must be idempotent — Polar retries until it sees 2xx, so the same
 * event can arrive twice. Setting the same plan twice is harmless, which is
 * the property that makes that safe.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const ok = await verifyWebhook(rawBody, {
    id: req.headers.get('webhook-id'),
    timestamp: req.headers.get('webhook-timestamp'),
    signature: req.headers.get('webhook-signature'),
  })
  if (!ok) return NextResponse.json({ error: 'Bad signature' }, { status: 401 })

  let event: { type?: string; data?: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Not JSON' }, { status: 400 })
  }

  if (!event.type?.startsWith('subscription.')) {
    // Orders, checkouts, benefits — acknowledged so Polar stops retrying.
    return NextResponse.json({ received: true })
  }

  const sub = event.data as {
    status?: string
    product_id?: string
    cancel_at_period_end?: boolean
    current_period_end?: string | null
    ends_at?: string | null
    customer?: { external_id?: string | null }
    metadata?: { userId?: string }
  }

  // The account: the external id we stamped, with checkout metadata as the
  // fallback for subscriptions created before external ids were set.
  const userId = sub.customer?.external_id || sub.metadata?.userId
  if (!userId) return NextResponse.json({ received: true })

  // A plan set by hand outranks the machinery: a routine renewal event on an
  // old Founding subscription must not quietly erase a Studio grant. A real
  // *paid* upgrade still wins — money talks — but downgrades don't touch it.
  const current = await getUserById(userId)
  const status = sub.status || 'unknown'
  const paidPlan = sub.product_id ? planForProduct(sub.product_id) : null
  const endsAt = sub.ends_at || sub.current_period_end || undefined
  // Cancelling is not the same as ending: someone who cancels mid-month has
  // paid until the period closes, and keeps the plan until then. The revoke
  // event at period end arrives with an ends_at in the past and takes it.
  const paidUntilLater = Boolean(endsAt && Date.parse(endsAt) > Date.now())
  const entitled = paidPlan !== null && (statusEntitles(status) || paidUntilLater)

  if (current?.subscriptionStatus === 'granted' && !entitled) {
    return NextResponse.json({ received: true })
  }

  await setBilling(userId, {
    plan: entitled ? paidPlan : 'free',
    // "Cancelled but paid through the period" is its own state — the settings
    // page owes the person an "ends on X" while it still matters, and Polar
    // reports the status as plain "active" during that window.
    subscriptionStatus: entitled && sub.cancel_at_period_end ? 'canceling' : status,
    subscriptionEndsAt: entitled ? endsAt : undefined,
  })

  return NextResponse.json({ received: true })
}
