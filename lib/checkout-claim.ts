/**
 * The bridge between a payment and the person standing on the success page.
 *
 * Polar's webhook is signed, so what it says is trustworthy: this checkout was
 * paid, by this address. Recording that against the checkout id means the
 * return from payment can sign someone in from our own store, with no API call
 * and no access token in the path. The id in the URL is the only thing the
 * browser carries, so it is treated as a credential: it must match a payment we
 * were actually told about, and it works exactly once.
 */

import { getStorage } from './db'

export interface CheckoutClaim {
  userId: string
  /** Set the moment it's redeemed. A second visit gets nothing. */
  usedAt?: string
}

const NS = 'checkout'

export async function readClaim(checkoutId: string): Promise<CheckoutClaim | null> {
  return getStorage().getJSON<CheckoutClaim>(NS, checkoutId)
}

/** Remember who a paid checkout belongs to. Safe to call again on a retry. */
export async function recordClaim(checkoutId: string, userId: string): Promise<void> {
  const existing = await readClaim(checkoutId)
  if (existing) return
  await getStorage().putJSON(NS, checkoutId, { userId })
}

export async function redeemClaim(checkoutId: string, claim: CheckoutClaim): Promise<void> {
  await getStorage().putJSON(NS, checkoutId, { ...claim, usedAt: new Date().toISOString() })
}

/**
 * The redirect and the webhook race, and the redirect usually wins by a hair.
 * A short wait covers that gap; anything longer belongs to the email path,
 * because a person watching a blank tab has a different patience budget.
 */
export async function waitForClaim(checkoutId: string, tries = 3, gapMs = 800): Promise<CheckoutClaim | null> {
  for (let i = 0; i < tries; i++) {
    await new Promise(resolve => setTimeout(resolve, gapMs))
    const claim = await readClaim(checkoutId)
    if (claim) return claim
  }
  return null
}
