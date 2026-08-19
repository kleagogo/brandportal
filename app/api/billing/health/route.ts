import { NextResponse } from 'next/server'
import { polarConfigured, polarTokenStatus } from '@/lib/polar'

/**
 * Is billing actually wired up? Says whether the products are set and whether
 * Polar accepts the access token, and nothing else — no secret, no amounts, no
 * customers. Exists so a broken token is a five-second check instead of a
 * customer discovering it at the till.
 */
export async function GET() {
  return NextResponse.json({
    configured: polarConfigured(),
    products: {
      founding: Boolean(process.env.POLAR_PRODUCT_FOUNDING),
      studio: Boolean(process.env.POLAR_PRODUCT_STUDIO),
    },
    webhookSecret: Boolean(process.env.POLAR_WEBHOOK_SECRET),
    token: await polarTokenStatus(),
  })
}
