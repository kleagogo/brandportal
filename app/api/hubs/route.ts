import { NextRequest, NextResponse } from 'next/server'
import { countOwnedHubs, createHub, getStudioHub } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'
import { blankHubConfig } from '@/lib/brand-builder'
import { limitsFor } from '@/lib/limits'

/**
 * Create a hub for the signed-in user.
 *
 * Two kinds: the studio hub — their own brand, one per account, outside the
 * plan limit — and client spaces, which the limit counts and which start from
 * the studio hub's layout when there is one.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in to create a client space' }, { status: 401 })

  let name = ''
  let studio = false
  let primaryColor: string | undefined
  try {
    const body = await req.json()
    if (typeof body?.name === 'string' && body.name.trim()) name = body.name.trim().slice(0, 60)
    if (typeof body?.primaryColor === 'string' && body.primaryColor.trim()) primaryColor = body.primaryColor.trim()
    studio = body?.studio === true
  } catch { /* empty body is fine */ }

  if (studio) {
    // One studio per account. Someone who clicks twice should land on the hub
    // they already have rather than end up with two brands of their own.
    const existing = await getStudioHub(user.id)
    if (existing) {
      return NextResponse.json({ slug: existing.hub.slug, existing: true })
    }
    const hub = await createHub(blankHubConfig(name || 'Our studio', { kind: 'studio', primaryColor }), user.id, { studio: true })
    return NextResponse.json({ slug: hub.slug })
  }

  const limits = limitsFor(user)
  if ((await countOwnedHubs(user.id)) >= limits.hubs) {
    return NextResponse.json({ error: `Your plan includes ${limits.hubs} client spaces. Studio raises the limit.` }, { status: 403 })
  }

  // House style: a client space starts from the studio hub's own layout, minus
  // the sections that only make sense at the agency. Reorganise your own hub
  // and the next client you set up follows it.
  const studioHub = await getStudioHub(user.id)
  const layout = studioHub?.hub.sections.filter(section => !section.studioOnly)

  const hub = await createHub(
    blankHubConfig(name || 'Untitled brand', { kind: 'client', layout, primaryColor }),
    user.id,
    name ? { client: name } : {},
  )
  return NextResponse.json({ slug: hub.slug })
}
