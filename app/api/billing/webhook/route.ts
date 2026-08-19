import { NextRequest, NextResponse } from 'next/server'
import { planForProduct, statusEntitles, verifyWebhook } from '@/lib/polar'
import { ensureUser, getUserByEmail, getUserById, setBilling, type User } from '@/lib/users'
import { accountForPayment, sendWelcomeOnce } from '@/lib/welcome'
import { recordClaim } from '@/lib/checkout-claim'

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
  // Verification that throws is still a "no", not a 500. Polar retries on 5xx
  // and gives up eventually, so a crash here silently loses paid subscriptions.
  let ok = false
  try {
    ok = await verifyWebhook(rawBody, {
      id: req.headers.get('webhook-id'),
      timestamp: req.headers.get('webhook-timestamp'),
      signature: req.headers.get('webhook-signature'),
    })
  } catch (err) {
    console.error('[billing] Webhook verification could not run:', err)
  }
  if (!ok) return NextResponse.json({ error: 'Bad signature' }, { status: 401 })

  let event: { type?: string; data?: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Not JSON' }, { status: 400 })
  }

  // A paid checkout is the earliest signed word that money moved, and it
  // carries the id the buyer's browser is holding. Recording it here is what
  // lets the success page sign them in without asking Polar anything.
  if (event.type?.startsWith('checkout.')) {
    const checkout = event.data as {
      id?: string
      status?: string
      customer_email?: string | null
      product_id?: string | null
      products?: Array<{ id?: string }>
    }
    const paid = checkout.status === 'succeeded' || checkout.status === 'confirmed'
    if (paid && checkout.id && checkout.customer_email) {
      const product = checkout.product_id || checkout.products?.[0]?.id || null
      const user = await accountForPayment(checkout.customer_email, product)
      await recordClaim(checkout.id, user.id)
      await sendWelcomeOnce(user, req.nextUrl.origin)
    }
    return NextResponse.json({ received: true })
  }

  if (!event.type?.startsWith('subscription.')) {
    // Orders, benefits — acknowledged so Polar stops retrying.
    return NextResponse.json({ received: true })
  }

  const sub = event.data as {
    status?: string
    product_id?: string
    cancel_at_period_end?: boolean
    current_period_end?: string | null
    ends_at?: string | null
    customer?: { external_id?: string | null; email?: string | null }
    metadata?: { userId?: string }
  }

  // The account: the external id we stamped on a checkout started from inside
  // the app, with checkout metadata as the fallback for older subscriptions.
  const stampedId = sub.customer?.external_id || sub.metadata?.userId
  const email = sub.customer?.email

  // A purchase from the marketing site has no stamped id — nobody was signed in
  // when it started. The address on the payment is who it belongs to, so the
  // account is found or created from it. Without this, someone can pay and end
  // up with nothing but a receipt.
  let current: User | null = stampedId ? await getUserById(stampedId) : null
  const fromPaymentEmail = !current && Boolean(email)
  if (fromPaymentEmail && email) current = (await getUserByEmail(email)) || (await ensureUser(email))
  if (!current) return NextResponse.json({ received: true })

  const userId = current.id
  // A plan set by hand outranks the machinery: a routine renewal event on an
  // old Founding subscription must not quietly erase a Studio grant. A real
  // *paid* upgrade still wins — money talks — but downgrades don't touch it.
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

  // Someone who bought from the marketing site has an account now but may have
  // no way into it — they might never come back through the success redirect.
  // sendWelcomeOnce is the guard against Polar's retries mailing them twice.
  if (fromPaymentEmail && entitled) await sendWelcomeOnce(current, req.nextUrl.origin)

  return NextResponse.json({ received: true })
}
