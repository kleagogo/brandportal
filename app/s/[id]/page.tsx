import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getHub, getPortal, isPortalExpired } from '@/lib/store'
import { portalCookieName, portalCookieValue } from '@/lib/auth'
import { PortalView } from '@/app/components/portal/PortalView'
import { PortalGate } from '@/app/components/portal/PortalGate'
import type { BrandConfig } from '@/app/types/brand'

// Portals always read the live hub — a share link shows the current brand.
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const portal = await getPortal(id)
  if (!portal) return {}
  const hub = await getHub(portal.slug)
  const name = portal.branding?.name || hub?.name || 'Brand files'
  const logo = portal.branding?.logoUrl || hub?.logoUrl
  return {
    title: name,
    description: portal.branding?.note || hub?.tagline,
    // A white-labelled portal shouldn't be indexed as the agency's own page.
    robots: { index: false, follow: false },
    ...(logo ? { icons: { icon: logo } } : {}),
  }
}

export default async function PortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const portal = await getPortal(id)
  if (!portal) notFound()

  const hub = await getHub(portal.slug)
  if (!hub) notFound()

  const name = portal.branding?.name || hub.name
  const logo = portal.branding?.logoUrl || hub.logoUrl

  if (isPortalExpired(portal)) {
    return <PortalGate id={id} name={name} logoUrl={logo} expired />
  }

  if (portal.password) {
    const store = await cookies()
    const unlocked = store.get(portalCookieName(id))?.value === await portalCookieValue(id, portal.password)
    if (!unlocked) return <PortalGate id={id} name={name} logoUrl={logo} />
  }

  // The password never reaches the browser — the view doesn't need it.
  const safe = { ...portal, password: null }
  return <PortalView config={filterSections(hub, portal.sections)} portal={safe} />
}

/** Keep only the sections this portal shares (and their assets). */
function filterSections(hub: BrandConfig, ids?: string[]): BrandConfig {
  if (!ids || ids.length === 0) return hub
  const keep = new Set(ids)
  const sections = hub.sections.filter(s => keep.has(s.id))
  const assets: BrandConfig['assets'] = {}
  for (const section of sections) assets[section.id] = hub.assets[section.id] || []
  return { ...hub, sections, assets }
}
