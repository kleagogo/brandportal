/**
 * Stripe, over plain fetch.
 *
 * The official SDK assumes Node and pulls in a lot of it; this runs in a
 * Worker isolate where both the runtime and the size budget say otherwise.
 * Stripe's REST API is form-encoded and small, so three helpers cover
 * everything the product needs.
 *
 * Env:
 *   STRIPE_SECRET_KEY       sk_… — a Cloudflare Secret, never a var. Vars are
 *                           plain text and `wrangler deploy` rewrites them
 *                           from wrangler.jsonc, so a key there would be both
 *                           readable and fragile.
 *   STRIPE_PRICE_ID         price_… for the €19/month plan
 *   STRIPE_WEBHOOK_SECRET   whsec_… used to verify Stripe really sent it
 */

const API = 'https://api.stripe.com/v1'

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID)
}

/** Stripe takes form encoding, including for nested keys like a[b]. */
function encode(params: Record<string, string | undefined>): string {
  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) body.set(k, v)
  }
  return body.toString()
}

async function call<T>(path: string, params: Record<string, string | undefined>): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: encode(params),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message || `Stripe rejected the request (${res.status})`)
  }
  return data as T
}

/** Where someone goes to start paying. */
export function createCheckoutSession(opts: {
  email: string
  userId: string
  successUrl: string
  cancelUrl: string
  customerId?: string
}): Promise<{ url: string }> {
  return call('/checkout/sessions', {
    mode: 'subscription',
    'line_items[0][price]': process.env.STRIPE_PRICE_ID,
    'line_items[0][quantity]': '1',
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    // Reusing the customer keeps one person to one Stripe record across
    // upgrades, cancellations and coming back.
    ...(opts.customerId ? { customer: opts.customerId } : { customer_email: opts.email }),
    client_reference_id: opts.userId,
    'subscription_data[metadata][userId]': opts.userId,
    allow_promotion_codes: 'true',
  })
}

/**
 * Stripe's own account page: payment method, invoices, cancellation.
 * Hosted by them, which is most of the billing surface for none of the code.
 */
export function createPortalSession(opts: {
  customerId: string
  returnUrl: string
}): Promise<{ url: string }> {
  return call('/billing_portal/sessions', {
    customer: opts.customerId,
    return_url: opts.returnUrl,
  })
}

/**
 * Is this webhook really from Stripe?
 *
 * The signature header carries a timestamp and an HMAC of "timestamp.body".
 * Without this check the endpoint is an open invitation to grant anyone a Pro
 * plan by POSTing a fake subscription event.
 */
export async function verifyWebhook(rawBody: string, header: string | null): Promise<boolean> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !header) return false

  const parts = Object.fromEntries(
    header.split(',').map(p => p.split('=', 2) as [string, string])
  )
  const timestamp = parts.t
  const signature = parts.v1
  if (!timestamp || !signature) return false

  // Stripe replays are only accepted for five minutes, so a captured request
  // can't be posted back later.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(age) || age > 300) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${rawBody}`))
  const expected = [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, '0')).join('')

  // Constant-time compare: a fast reject leaks how much of the digest matched.
  if (expected.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  return diff === 0
}
