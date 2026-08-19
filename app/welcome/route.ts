import { NextRequest, NextResponse } from 'next/server'
import { checkoutSucceeded, getCheckout, planForProduct } from '@/lib/polar'
import { ensureUser, getUserByEmail, setBilling } from '@/lib/users'
import { SESSION_COOKIE, createSessionValue } from '@/lib/auth'
import { getStorage } from '@/lib/db'
import { sendWelcomeOnce } from '@/lib/welcome'

/**
 * Where Polar sends someone the moment they've paid.
 *
 * They bought from the marketing site, so they have a receipt and no account.
 * Making them go and find an email before they can see what they just paid for
 * is the wrong first minute, so this creates the account, signs them in, and
 * drops them on the dashboard. The email still goes out, as their record of it.
 *
 * The checkout id in the URL is the proof, and it is treated like one: Polar is
 * asked whether that checkout really succeeded, and the id only works once, so
 * a link that leaks later opens nothing.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin
  const id = req.nextUrl.searchParams.get('checkout_id') || ''
  const dashboard = NextResponse.redirect(new URL('/dashboard', origin))
  if (!id) return dashboard

  const checkout = await getCheckout(id)
  if (!checkout || !checkoutSucceeded(checkout) || !checkout.customer_email) {
    // Either it isn't a payment we can vouch for, or Polar wouldn't answer —
    // a rejected access token lands here too. The webhook still creates the
    // account and mails them, so send them to a page that says the payment
    // worked instead of a bare sign-in form.
    return NextResponse.redirect(new URL('/login?paid=1', origin))
  }

  // One id, one sign-in. A refresh or a shared URL lands on the dashboard,
  // which asks for a session of its own if they haven't got one.
  const seen = await getStorage().getJSON<{ usedAt: string }>('checkout', id)
  if (seen) return dashboard
  await getStorage().putJSON('checkout', id, { usedAt: new Date().toISOString() })

  const existing = await getUserByEmail(checkout.customer_email)
  const user = existing || (await ensureUser(checkout.customer_email))

  // The webhook is the authority on subscription status over time; this just
  // makes sure they aren't staring at a free plan in the seconds before it
  // arrives. A hand-set plan is left exactly as it is.
  const plan = checkout.product_id ? planForProduct(checkout.product_id) : null
  if (plan && user.subscriptionStatus !== 'granted') {
    await setBilling(user.id, { plan, subscriptionStatus: 'active' })
  }

  await sendWelcomeOnce(user, origin)

  dashboard.cookies.set(SESSION_COOKIE, await createSessionValue(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.nextUrl.protocol === 'https:',
    maxAge: 90 * 24 * 3600,
    path: '/',
  })
  return dashboard
}
