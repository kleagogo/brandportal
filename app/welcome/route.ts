import { NextRequest, NextResponse } from 'next/server'
import { checkoutSucceeded, getCheckout } from '@/lib/polar'
import { getUserById } from '@/lib/users'
import { SESSION_COOKIE, createSessionValue } from '@/lib/auth'
import { readClaim, recordClaim, redeemClaim, waitForClaim, type CheckoutClaim } from '@/lib/checkout-claim'
import { accountForPayment, sendWelcomeOnce } from '@/lib/welcome'

/**
 * Where Polar sends someone the moment they've paid.
 *
 * They bought from the marketing site, so they have a receipt and no account.
 * Making them go and find an email before they can see what they just paid for
 * is the wrong first minute, so this creates the account, signs them in, and
 * drops them on the dashboard.
 *
 * The checkout id in the URL is the only thing the browser carries, so it is
 * treated as the credential it is. Proof that it was paid comes from Polar's
 * signed webhook, recorded against the id — no access token in this path, so a
 * broken token can't cost someone their first minute. Asking Polar directly is
 * kept as a shortcut for when the webhook is still in flight.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin
  const id = req.nextUrl.searchParams.get('checkout_id') || ''
  const dashboard = NextResponse.redirect(new URL('/dashboard', origin))
  if (!id) return dashboard

  let claim: CheckoutClaim | null = await readClaim(id)
  // Already redeemed: a refresh, or a link that has been passed around. They
  // have their session from the first time; anyone else gets a sign-in page.
  if (claim?.usedAt) return dashboard

  // The webhook hasn't landed yet. If the access token happens to work, Polar
  // can confirm the payment right now instead of making them wait.
  if (!claim) {
    const checkout = await getCheckout(id)
    if (checkout && checkoutSucceeded(checkout) && checkout.customer_email) {
      const user = await accountForPayment(checkout.customer_email, checkout.product_id)
      await recordClaim(id, user.id)
      await sendWelcomeOnce(user, origin)
      claim = { userId: user.id }
    }
  }

  // Otherwise give the webhook a couple of seconds to arrive.
  if (!claim) claim = await waitForClaim(id)

  const user = claim ? await getUserById(claim.userId) : null
  if (!claim || !user) {
    // The payment is real but we can't tie it to an account yet. The webhook
    // still creates it and mails them the way in, so say exactly that instead
    // of handing them a sign-up form for an account they've already bought.
    return NextResponse.redirect(new URL('/paid', origin))
  }

  await redeemClaim(id, claim)
  dashboard.cookies.set(SESSION_COOKIE, await createSessionValue(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.nextUrl.protocol === 'https:',
    maxAge: 90 * 24 * 3600,
    path: '/',
  })
  return dashboard
}
