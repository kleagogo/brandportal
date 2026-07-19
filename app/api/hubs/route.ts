import { NextRequest, NextResponse } from 'next/server'
import { countOwnedHubs, createHub } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'
import { buildConfigFromScan } from '@/lib/brand-builder'
import { limitsFor } from '@/lib/limits'

/** Create a blank hub for the signed-in user (dashboard "New hub"). */
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in to create a hub' }, { status: 401 })

  const limits = limitsFor(user)
  if ((await countOwnedHubs(user.id)) >= limits.hubs) {
    return NextResponse.json({ error: `Your plan includes ${limits.hubs} hub${limits.hubs === 1 ? '' : 's'} — Pro (coming soon) raises the limit` }, { status: 403 })
  }

  let name = 'Untitled brand'
  try {
    const body = await req.json()
    if (typeof body?.name === 'string' && body.name.trim()) name = body.name.trim().slice(0, 60)
  } catch { /* empty body is fine */ }

  const config = buildConfigFromScan({
    brandName: name,
    tagline: '',
    primaryColor: '#1a1a1a',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter',
  })
  // A blank hub shouldn't pretend to have scanned assets.
  config.assets.logo = []
  const hub = await createHub(config, user.id)
  return NextResponse.json({ slug: hub.slug })
}
