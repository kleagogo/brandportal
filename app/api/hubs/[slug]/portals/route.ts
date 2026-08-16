import { NextRequest, NextResponse } from 'next/server'
import { canEditHub, createPortal, getHub, getMeta, getStudioHub, listPortals } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'
import { getPortalStats } from '@/lib/analytics'
import { normalizePortalInput } from '@/lib/portal-input'
import type { PortalBranding } from '@/app/types/brand'

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
    branding: await brandingWithStudioDefaults(input.value.branding, meta.studio ? null : meta.ownerId),
  })
  return NextResponse.json({ portal })
}

/**
 * Sign a client portal with the agency that made it.
 *
 * Only the credit line and the accent are defaulted. The header name and logo
 * are deliberately left alone: the client opens this link to find *their* own
 * brand, and a default that swapped their logo for the studio's would take the
 * client's identity off their own brand hub. An agency that does want the
 * takeover can still set both explicitly. `hideCredit` is left untouched too —
 * removing the Pitho credit is a paid white-label choice, not a default.
 *
 * Portals shared from the studio hub itself get nothing: they already are the
 * agency's brand.
 */
async function brandingWithStudioDefaults(
  branding: PortalBranding | undefined,
  ownerId: string | null,
): Promise<PortalBranding | undefined> {
  if (!ownerId) return branding
  const studio = await getStudioHub(ownerId)
  if (!studio) return branding

  const filled: PortalBranding = { ...branding }
  if (!filled.note) filled.note = `Prepared by ${studio.hub.name}`
  if (!filled.accent) {
    const accent = studio.hub.colors?.[0]?.swatches?.[0]?.hex
    if (accent) filled.accent = accent
  }
  return Object.keys(filled).length ? filled : branding
}
