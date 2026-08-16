/**
 * Builds the starting BrandConfig for a new hub: a real structure — sections, a
 * palette derived from one brand color, a typeface, guidelines scaffolding —
 * with no assets in it yet. Everything here is a starting point the owner edits
 * in place.
 *
 * A studio hub gets the agency's own furniture on top of the brand sections; a
 * client space can instead start from the studio hub's layout, so house style
 * spreads without being configured twice.
 */

import type { BrandConfig, ColorGroup, SectionConfig } from '@/app/types/brand'
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
  { id: 'templates', label: 'Templates', type: 'assets', icon: 'templates', group: 'resources', studioOnly: true },
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
  const { kind = 'client', primaryColor = '#1a1a1a', layout } = options
  const brandName = name.trim() || 'Your brand'
  const primary = normalizeHex(primaryColor) || '#1a1a1a'
  const tagline = 'One source of truth for our brand.'

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

  // ── Colors: a working palette from the one color we know.
  // Deduped by hex, so a brand color that happens to be black or white doesn't
  // show up twice under two different names.
  const used = new Set<string>()
  const swatch = (label: string, hex: string, usage: string) => {
    const h = normalizeHex(hex)
    if (!h || used.has(h)) return null
    used.add(h)
    return { name: label, hex: h, usage }
  }
  const compact = <T,>(items: Array<T | null>): T[] => items.filter((s): s is T => s !== null)

  const colors: ColorGroup[] = [
    {
      group: 'Brand',
      swatches: compact([
        swatch('Brand', primary, 'Primary brand color'),
        swatch('Brand 80', mix(primary, '#ffffff', 0.2), 'Hover states, secondary emphasis'),
        swatch('Brand 20', mix(primary, '#ffffff', 0.8), 'Tints, subtle backgrounds'),
      ]),
    },
    {
      group: 'Surfaces & neutrals',
      swatches: compact([
        swatch('Background', '#ffffff', 'Page background'),
        swatch('Border', '#d9d8d4', 'Borders and dividers'),
        swatch('Muted text', '#8a8a85', 'Secondary text, captions'),
        swatch('Ink', '#1a1a1a', 'Body text, primary UI'),
      ]),
    },
  ]

  return {
    slug: slugify(brandName) || 'brand',
    name: brandName,
    tagline,

    colors,
    typography: [{
      group: 'Brand typefaces',
      fonts: [{
        name: 'Inter',
        role: 'Primary typeface',
        weights: ['400', '500', '600', '700'],
        usage: 'Headlines, body copy, and UI',
        importUrl: googleFontUrl('Inter', ['400', '500', '600', '700']),
        specimens: [
          { label: 'Display', size: '36px', weight: '700', sample: tagline },
          { label: 'Heading', size: '22px', weight: '600', sample: `${brandName} brand guidelines` },
          { label: 'Body', size: '15px', weight: '400', sample: 'Everything you need to represent our brand, in one place.' },
          { label: 'Caption', size: '12px', weight: '500', sample: 'BRAND ASSETS · UPDATED TODAY' },
        ],
      }],
    }],

    sections,
    assets,

    guidelines: {
      voice: {
        title: 'Brand voice',
        description: `How ${brandName} speaks and writes. Edit these principles to match your voice.`,
        principles: [
          { name: 'Clear', description: 'We say what we mean. No jargon, no fluff.' },
          { name: 'Confident', description: 'We know our subject and it shows — without arrogance.' },
          { name: 'Human', description: 'We write to a person, not an audience.' },
        ],
      },
      usage: {
        dos: [
          'Use the primary logo on light backgrounds',
          'Keep clear space around the logo on all sides',
          'Use the brand color for primary actions only',
        ],
        donts: [
          'Don’t stretch, rotate, or recolor the logo',
          'Don’t place the logo on busy backgrounds without a container',
          'Don’t introduce colors outside this palette',
        ],
      },
    },

    agent: {
      enabled: true,
      name: 'Brand Agent',
      greeting: `Ask me anything about the ${brandName} brand — colors, logo usage, typography, tone of voice.`,
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

/** Mix a hex color toward another by ratio (0 = all `a`, 1 = all `b`). */
function mix(a: string, b: string, ratio: number): string {
  const pa = normalizeHex(a) || '#1a1a1a'
  const pb = normalizeHex(b) || '#ffffff'
  const ch = (i: number) => {
    const va = parseInt(pa.slice(i, i + 2), 16)
    const vb = parseInt(pb.slice(i, i + 2), 16)
    return Math.round(va + (vb - va) * ratio).toString(16).padStart(2, '0')
  }
  return `#${ch(1)}${ch(3)}${ch(5)}`
}

function googleFontUrl(name: string, weights: string[]): string {
  const family = name.trim().replace(/ /g, '+')
  return `https://fonts.googleapis.com/css2?family=${family}:wght@${weights.join(';')}&display=swap`
}
