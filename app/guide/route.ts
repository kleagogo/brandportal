import { NextRequest, NextResponse } from 'next/server'

/**
 * The short address for the build guide, printed on a QR code.
 *
 * A QR grows denser with every character, and a code on a slide has to survive
 * being photographed from the back of a room. This keeps the printed URL to a
 * couple of dozen characters, and keeps the destination changeable without
 * reprinting anything.
 */
export function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/demo?section=templates', req.nextUrl.origin))
}
