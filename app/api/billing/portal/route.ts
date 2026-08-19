import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createPortalSession, polarConfigured } from '@/lib/polar'

/**
 * Manage the subscription: invoices, payment method, cancel. All of it is
 * Polar's hosted page — we only mint the signed way in.
 */
export async function POST() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  if (!polarConfigured()) {
    return NextResponse.json({ error: 'Billing isn’t switched on yet' }, { status: 503 })
  }
  try {
    const { url } = await createPortalSession(user.id)
    return NextResponse.json({ url })
  } catch {
    // The usual cause: no subscription, so Polar has no customer for us yet.
    return NextResponse.json({ error: 'No subscription on this account yet' }, { status: 404 })
  }
}
