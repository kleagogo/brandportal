import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { listHubsForUser } from '@/lib/store'

/** Who am I + which hubs can I touch. Used by client nav and the dashboard. */
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ user: null, hubs: [] })
  const hubs = await listHubsForUser(user)
  return NextResponse.json({
    user: { id: user.id, email: user.email },
    hubs: hubs.map(({ hub, meta, role }) => ({
      slug: hub.slug,
      name: hub.name,
      tagline: hub.tagline,
      logoUrl: hub.logoUrl || null,
      role,
      hasPin: Boolean(meta.pin),
      updatedAt: hub.updatedAt || null,
    })),
  })
}
