/**
 * The "you're in" email for someone who paid before they had an account.
 *
 * Two paths can reach this: the webhook Polar sends, and the person's own
 * return from checkout. Whichever arrives first sends it, and the flag on the
 * account keeps the other quiet — a new customer should not get the same email
 * twice because Polar happened to retry.
 */

import { createToken } from './tokens'
import { sendMagicLink } from './email'
import { ensureUser, getUserByEmail, markWelcomed, setBilling, type User } from './users'
import { planForProduct } from './polar'

/**
 * The account a payment belongs to, created if this is their first contact.
 *
 * Used by both paths into the product: the webhook, and the person's own
 * return from checkout. Idempotent, because both usually happen.
 */
export async function accountForPayment(email: string, productId?: string | null): Promise<User> {
  const existing = await getUserByEmail(email)
  const user = existing || (await ensureUser(email))
  const plan = productId ? planForProduct(productId) : null
  // A plan set by hand is left alone; the webhook stays the authority on
  // status over time. This only stops a new customer seeing "Free plan" in
  // the seconds between paying and the webhook landing.
  if (plan && user.subscriptionStatus !== 'granted' && user.plan !== plan) {
    await setBilling(user.id, { plan, subscriptionStatus: 'active' })
  }
  return user
}

export async function sendWelcomeOnce(user: User, origin: string): Promise<void> {
  if (user.welcomedAt) return
  // Claim it before sending: the webhook and the redirect can land together,
  // and a duplicate email is worse than a missed one when they're already in.
  await markWelcomed(user.id)
  try {
    const token = await createToken({ purpose: 'login', email: user.email, redirect: '/dashboard' })
    await sendMagicLink({
      to: user.email,
      url: `${origin}/api/auth/verify?token=${token}`,
      kind: 'welcome',
    })
  } catch (err) {
    // They have the plan and, on the redirect path, a session too. A failed
    // email is not worth failing the request they're waiting on.
    console.error('[billing] Could not send the welcome email:', err)
  }
}
