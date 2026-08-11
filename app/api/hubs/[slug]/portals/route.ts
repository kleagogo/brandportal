import { NextRequest, NextResponse } from 'next/server'
import { canEditHub, createPortal, getHub, getMeta, listPortals } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'
import { getPortalStats } from '@/lib/analytics'
import { normalizePortalInput } from '@/lib/portal-input'

/** Share portals for a hub — editors and the owner manage them. */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const meta = await getMeta(slug)
  const user = await getSessionUser()
  if (!canEditHub(meta, user)) {
    return NextResponse.json({ error: 'Only the hub’s editors can see share links' }, { status: 403 })
  }
  const portals = await listPortals(slug)
  // Each link carries its own view/download counts.
  const stats: Record<string, { views: number; downloads: number; lastViewAt?: string }> = {}
  for (const portal of portals) {
    const { views, downloads, lastViewAt } = await getPortalStats(portal.id)
    stats[portal.id] = { views, downloads, lastViewAt }
  }
  return NextResponse.json({ portals, stats })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const meta = await getMeta(slug)
  const user = await getSessionUser()
  if (!canEditHub(meta, user)) {
    return NextResponse.json({ error: 'Only the hub’s editors can create share links' }, { status: 403 })
  }
  const hub = await getHub(slug)
  if (!hub) return NextResponse.json({ error: 'Hub not found' }, { status: 404 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const input = normalizePortalInput(body)
  if ('error' in input) return NextResponse.json({ error: input.error }, { status: 400 })

  const portal = await createPortal({
    slug,
    name: input.value.name || `${hub.name} share`,
    template: input.value.template ?? 'full',
    sections: input.value.sections,
    password: input.value.password ?? null,
    expiresAt: input.value.expiresAt ?? null,
    allowDownload: input.value.allowDownload ?? true,
    branding: input.value.branding,
  })
  return NextResponse.json({ portal })
}
