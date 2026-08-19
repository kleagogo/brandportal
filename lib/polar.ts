/**
 * Polar, over plain fetch.
 *
 * Polar is the merchant of record: they are the legal seller, they handle
 * VAT, and they pay out. This file is the wiring between a payment and a
 * Pitho account — a checkout that knows who is paying, and a webhook that
 * flips the right account when money moves. Their SDK assumes Node; a Worker
 * doesn't, and the REST surface we need is four calls.
 *
 * Every checkout carries `external_customer_id` = our user id, so webhooks
 * come back stamped with the account they belong to. No provider customer id
 * to store, no matching payments to accounts by email.
 *
 * Env:
 *   POLAR_ACCESS_TOKEN     organization access token — a Cloudflare Secret
 *   POLAR_WEBHOOK_SECRET   whsec_… from the webhook endpoint — also a Secret
 *   POLAR_PRODUCT_FOUNDING product id of the $19/month plan
 *   POLAR_PRODUCT_STUDIO   product id of the $49/month plan
 *   POLAR_SERVER           "sandbox" while testing; unset/production for real
 */

export type PaidPlan = 'pro' | 'studio'

function apiBase(): string {
  return process.env.POLAR_SERVER === 'sandbox'
    ? 'https://sandbox-api.polar.sh/v1'
    : 'https://api.polar.sh/v1'
}

export function polarConfigured(): boolean {
  return Boolean(process.env.POLAR_ACCESS_TOKEN && process.env.POLAR_PRODUCT_FOUNDING)
}

/** The Polar product behind each plan. Studio is optional until it exists. */
export function productForPlan(plan: PaidPlan): string | null {
  if (plan === 'pro') return process.env.POLAR_PRODUCT_FOUNDING || null
  return process.env.POLAR_PRODUCT_STUDIO || null
}

/** Which plan a webhook's product grants. Unknown products grant nothing. */
export function planForProduct(productId: string): PaidPlan | null {
  if (productId === process.env.POLAR_PRODUCT_FOUNDING) return 'pro'
  if (productId === process.env.POLAR_PRODUCT_STUDIO) return 'studio'
  return null
}

async function call<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = (data as { detail?: unknown }).detail
    throw new Error(typeof detail === 'string' ? detail : `Polar rejected the request (${res.status})`)
  }
  return data as T
}

/** A checkout that knows which account is paying. */
export function createCheckout(opts: {
  plan: PaidPlan
  userId: string
  email: string
  successUrl: string
}): Promise<{ url: string }> {
  const product = productForPlan(opts.plan)
  if (!product) throw new Error('That plan isn’t configured yet')
  return call('/checkouts/', {
    products: [product],
    success_url: opts.successUrl,
    customer_email: opts.email,
    external_customer_id: opts.userId,
    metadata: { userId: opts.userId, plan: opts.plan },
  })
}

/**
 * Polar's hosted account page: invoices, payment method, cancel. Addressed by
 * our user id, so it works with nothing stored on our side.
 */
export async function createPortalSession(userId: string): Promise<{ url: string }> {
  const session = await call<{ customer_portal_url: string }>('/customer-sessions/', {
    external_customer_id: userId,
  })
  return { url: session.customer_portal_url }
}

/**
 * Is this webhook really from Polar?
 *
 * Standard Webhooks scheme: HMAC-SHA256 over "id.timestamp.body" with the
 * base64 secret, compared against each candidate in the signature header.
 * Without this, the endpoint is an open door to free Pro plans.
 */
export async function verifyWebhook(
  rawBody: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null }
): Promise<boolean> {
  const secret = process.env.POLAR_WEBHOOK_SECRET
  if (!secret || !headers.id || !headers.timestamp || !headers.signature) return false

  // Replays are stale after five minutes.
  const age = Math.abs(Date.now() / 1000 - Number(headers.timestamp))
  if (!Number.isFinite(age) || age > 300) return false

  const rawSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret
  const keyBytes = Uint8Array.from(atob(rawSecret), c => c.charCodeAt(0))
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = await crypto.subtle.sign(
    'HMAC', key,
    new TextEncoder().encode(`${headers.id}.${headers.timestamp}.${rawBody}`)
  )
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)))

  // The header may carry several space-separated "v1,<sig>" candidates.
  for (const part of headers.signature.split(' ')) {
    const candidate = part.startsWith('v1,') ? part.slice(3) : part
    if (candidate.length !== expected.length) continue
    let diff = 0
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ candidate.charCodeAt(i)
    if (diff === 0) return true
  }
  return false
}

/** The subscription statuses that mean "keep the paid plan on". past_due
 *  rides along: the card failed, Polar is retrying, and yanking access while
 *  it does creates the support ticket the retry exists to avoid. */
export function statusEntitles(status: string): boolean {
  return status === 'active' || status === 'trialing' || status === 'past_due'
}
