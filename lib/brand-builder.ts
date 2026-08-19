/**
 * Builds the starting BrandConfig for a new hub: the section structure, and
 * nothing in it.
 *
 * It used to invent a brand — a palette mixed from a default ink, Inter as the
 * typeface, voice principles, logo dos and don'ts — none of which anyone had
 * chosen. A hub shared before its owner edited it showed a client a brand that
 * nobody designed, which is worse than showing them nothing. The sections stay
 * because they say where things go. Everything they hold starts empty.
 *
 * A studio hub gets the agency's own furniture on top of the brand sections; a
 * client space can instead start from the studio hub's layout, so house style
 * spreads without being configured twice.
 */

import type { BrandConfig, SectionConfig } from '@/app/types/brand'
import { slugify } from './store'

/** A hub holds either the account's own brand, or a client's. */
export type HubKind = 'client' | 'studio'

/**
 * The brand itself — every hub starts here, client or studio, and a new client
 * space inherits this shape from the studio hub's own layout.
 *
 * Grouped the way the demo hub is (Assets, then Resources), because everything
 * a person needs is then reachable from one screen. Deliberately no Home
 * section: it was a hero for the Brand Agent, which meant the first thing
 * anyone saw in a hub was a chat box rather than the brand.
 */
const BRAND_SECTIONS: SectionConfig[] = [
  // The written half of a brand book, before the files: what the brand is,
  // how it behaves, how it sounds. Each is prose under its own id.
  { id: 'brand-story',       label: 'Brand Story',            type: 'doc', icon: 'book',        group: 'assets' },
  { id: 'brand-personality', label: 'Brand Personality',      type: 'doc', icon: 'fingerprint', group: 'assets' },
  { id: 'visual-identity',   label: 'Visual Identity',        type: 'doc', icon: 'eye',         group: 'assets' },
  { id: 'brand-voice',       label: 'Brand Voice',            type: 'doc', icon: 'chat',        group: 'assets' },
  { id: 'photography',       label: 'Photography Guidelines', type: 'doc', icon: 'camera',      group: 'assets' },

  { id: 'logo',        label: 'Logo',               type: 'assets',     icon: 'logo',        group: 'assets' },
  { id: 'colors',      label: 'Colors & Gradients', type: 'colors',     icon: 'colors',      group: 'assets' },
  { id: 'typography',  label: 'Typography',         type: 'typography', icon: 'type',        group: 'assets' },
  { id: 'screenshots', label: 'Screenshots',        type: 'assets',     icon: 'screenshots', group: 'assets' },
  { id: 'artwork',     label: 'Artwork',            type: 'assets',     icon: 'artwork',     group: 'assets' },
  { id: 'guidelines',  label: 'Guidelines',         type: 'guidelines', icon: 'guidelines',  group: 'assets' },
  { id: 'templates',   label: 'Templates',          type: 'assets',     icon: 'templates',   group: 'resources' },
  { id: 'inspiration', label: 'Inspiration',        type: 'assets',     icon: 'sparkles',    group: 'resources' },
]

/**
 * The studio's own furniture — work about the work. A client has no use for
 * the deck you pitched them with, so these carry `studioOnly` and stay behind
 * when a client space copies this hub's layout.
 */
const STUDIO_SECTIONS: SectionConfig[] = [
  { id: 'case-studies', label: 'Case Studies', type: 'assets', icon: 'file', group: 'resources', studioOnly: true },
  { id: 'decks', label: 'Proposal Decks', type: 'assets', icon: 'screenshots', group: 'resources', studioOnly: true },
  { id: 'signatures', label: 'Email Signatures', type: 'assets', icon: 'mail', group: 'resources', studioOnly: true },
]

export interface BlankHubOptions {
  kind?: HubKind
  primaryColor?: string
  /**
   * Section layout to start from — the studio hub's own, minus its studio-only
   * sections, so a reorganised studio hub becomes the house style for every
   * client space set up afterwards.
   */
  layout?: SectionConfig[]
}

export function blankHubConfig(name: string, options: BlankHubOptions = {}): BrandConfig {
  const { kind = 'client', layout } = options
  const brandName = name.trim() || 'Your brand'

  const sections: SectionConfig[] = layout && layout.length
    ? layout.map(section => ({ ...section }))
    : kind === 'studio'
      ? [...BRAND_SECTIONS, ...STUDIO_SECTIONS]
      : [...BRAND_SECTIONS]

  // Every section that holds files needs a list to hold them in.
  const assets: BrandConfig['assets'] = {}
  for (const section of sections) {
    if (section.type === 'assets') assets[section.id] = []
  }

  return {
    slug: slugify(brandName) || 'brand',
    name: brandName,
    // No tagline. A line the owner did not write is still a line a client reads.
    tagline: '',

    colors: [],
    typography: [],

    sections,
    assets,

    guidelines: {},

    agent: {
      enabled: true,
      name: 'Brand Agent',
      greeting: `Ask me anything about the ${brandName} brand.`,
      model: 'claude-haiku-4-5-20251001',
    },
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function normalizeHex(v: string | null | undefined): string | null {
  if (!v) return null
  let h = v.trim().toLowerCase()
  if (!h.startsWith('#')) return null
  if (/^#[0-9a-f]{3}$/.test(h)) h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`
  if (/^#[0-9a-f]{8}$/.test(h)) h = h.slice(0, 7)
  return /^#[0-9a-f]{6}$/.test(h) ? h : null
}
