import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { listHubsForUser } from '@/lib/store'
import { demoHubSummaries } from '@/lib/demo-hubs'

/**
 * Who am I + which hubs can I touch. Used by client nav and the dashboard.
 *
 * `demoHubs` goes out signed in or not: the switcher needs them to show a
 * visitor that hubs come one per client, which is the whole point and was
 * invisible while the demo listed nothing beside itself.
 */
export async function GET() {
  const user = await getSessionUser()
  const demoHubs = demoHubSummaries()
  if (!user) return NextResponse.json({ user: null, hubs: [], demoHubs })
  const hubs = await listHubsForUser(user)
  return NextResponse.json({
    user: { id: user.id, email: user.email },
    demoHubs,
    hubs: hubs.map(({ hub, meta, role }) => ({
      slug: hub.slug,
      name: hub.name,
      tagline: hub.tagline,
      logoUrl: hub.logoUrl || null,
      role,
      hasPin: Boolean(meta.pin),
      client: meta.client || '',
      updatedAt: hub.updatedAt || null,
    })),
  })
}
