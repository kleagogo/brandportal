/**
 * The hubs that ship with the app.
 *
 * These exist without a database row, so a fresh deployment has something to
 * show, and they carry no meta record, which is what makes `getMeta` report
 * them as demos and hand every visitor the sandbox.
 *
 * There is more than one on purpose. A single hub demonstrates what a hub
 * holds but not what the product is for — an agency keeping a hub per client.
 * The switcher needs somewhere to go for that to be legible.
 */

import seed from '@/brand.config'
import studioNorth from '@/studio-north.config'
import type { BrandConfig } from '@/app/types/brand'

/** The agency's own hub first; example client hubs after it. */
export const DEMO_HUBS: BrandConfig[] = [seed, studioNorth]

export const DEMO_SLUGS: ReadonlySet<string> = new Set(DEMO_HUBS.map(h => h.slug))

export function getDemoHub(slug: string): BrandConfig | null {
  return DEMO_HUBS.find(h => h.slug === slug) ?? null
}

/**
 * Is this hub the one we ship, rather than a stored hub that happens to share
 * its slug?
 *
 * Compared by identity, not by slug. `getHub` returns a stored record ahead of
 * the shipped config, so a slug test alone would hand demo treatment — public,
 * indexable, marketing copy — to somebody's real client work.
 */
export function isShippedDemoHub(slug: string, hub: BrandConfig): boolean {
  return getDemoHub(slug) === hub
}

/** Everything a switcher needs, without shipping whole configs to the client. */
export function demoHubSummaries(): Array<{ slug: string; name: string; tagline: string; logoUrl: string | null }> {
  return DEMO_HUBS.map(h => ({
    slug: h.slug,
    name: h.name,
    tagline: h.tagline,
    logoUrl: h.logoUrl || null,
  }))
}
