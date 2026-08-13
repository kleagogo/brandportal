import { NextRequest, NextResponse } from 'next/server'
import { getPortal, isPortalExpired } from '@/lib/store'
import { recordPortalEvent } from '@/lib/analytics'
import { allow, clientIp } from '@/lib/ratelimit'
import { portalCookieName, portalCookieValue } from '@/lib/auth'
import { cookies } from 'next/headers'

/**
 * Records a view or download on a share portal.
 *
 * Called by the portal page itself (once per browser session) and by its
 * download buttons, so downloads count wherever the file actually lives.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!allow(`portal-event:${clientIp(req)}`, 120, 60_000)) {
    return NextResponse.json({ ok: true }) // silently drop, never block a viewer
  }

  const portal = await getPortal(id)
  if (!portal || isPortalExpired(portal)) return NextResponse.json({ ok: true })

  // A protected portal only counts events from someone who unlocked it.
  if (portal.password) {
    const store = await cookies()
    if (store.get(portalCookieName(id))?.value !== await portalCookieValue(id, portal.password)) {
      return NextResponse.json({ ok: true })
    }
  }

  let type: string | undefined
  let label: string | undefined
  try {
    ({ type, label } = await req.json())
  } catch { /* sendBeacon bodies can arrive empty */ }

  if (type !== 'view' && type !== 'download') return NextResponse.json({ ok: true })

  await recordPortalEvent(id, type, typeof label === 'string' ? label : undefined)
  return NextResponse.json({ ok: true })
}
