/**
 * Builds a complete BrandConfig from a website scan, so a scanned site becomes
 * a real, fully-populated hub — not a thin preview. Everything generated here
 * is a sensible starting point the owner edits after claiming.
 */

import type { AssetFile, BrandConfig, ColorGroup } from '@/app/types/brand'
import { slugify } from './store'
import type { ScannedBrand } from './scanner'
import { normalizeHex } from './scanner'

export type ScanResult = Partial<ScannedBrand> & {
  brandName: string
  tagline: string
  primaryColor: string
  backgroundColor: string
  fontFamily: string
  faviconUrl?: string
  originalUrl?: string
}

export function buildConfigFromScan(scan: ScanResult): BrandConfig {
  const name = scan.brandName.trim() || 'Your brand'
  const primary = normalizeHex(scan.primaryColor) || '#1a1a1a'
  const accent = normalizeHex(scan.accentColor || '')
  const extras = (scan.extraColors || []).map(c => normalizeHex(c)).filter((c): c is string => Boolean(c))
  const bodyFont = cleanFontName(scan.fontFamily)
  const headingFont = scan.headingFont ? cleanFontName(scan.headingFont) : null
  const tagline = scan.tagline.trim() || 'One source of truth for our brand.'

  // ── Colors: structured by role, straight from the site's own CSS rules.
  const sem = scan.semantic || {}
  const used = new Set<string>()
  const swatch = (name: string, hex: string | null | undefined, usage: string) => {
    const h = normalizeHex(hex || '')
    if (!h || used.has(h)) return null
    used.add(h)
    return { name, hex: h, usage }
  }
  const compact = <T,>(items: Array<T | null>): T[] => items.filter((s): s is T => s !== null)

  const colors: ColorGroup[] = []

  const brandGroup = compact([
    swatch('Brand', primary, sem.buttonBg === primary ? 'Primary brand color — buttons and key actions' : 'Primary brand color'),
    swatch('Brand 80', mix(primary, '#ffffff', 0.2), 'Hover states, secondary emphasis'),
    swatch('Brand 20', mix(primary, '#ffffff', 0.8), 'Tints, subtle backgrounds'),
  ])
  colors.push({ group: 'Brand', swatches: brandGroup })

  const interactive = compact([
    sem.buttonBg !== primary ? swatch('Button', sem.buttonBg, 'Button backgrounds, primary actions') : null,
    swatch('Button text', sem.buttonText, 'Text on buttons'),
    swatch('Link', sem.link, 'Links and interactive text'),
    accent ? swatch('Accent', accent, 'Highlights and calls to action') : null,
    ...extras.slice(0, 2).map((hex, i) => swatch(`Support ${i + 1}`, hex, 'Found on your site — rename or remove')),
  ])
  if (interactive.length) colors.push({ group: 'Interactive & accents', swatches: interactive })

  const text = compact([
    swatch('Heading', sem.heading, 'Headlines and titles'),
    swatch('Body', sem.bodyText, 'Body copy and paragraphs'),
  ])
  if (text.length) colors.push({ group: 'Text', swatches: text })

  const surfaces = compact([
    swatch('Background', sem.background || scan.backgroundColor, 'Page background'),
    swatch('White', '#ffffff', 'Cards and surfaces'),
    swatch('Border', '#d9d8d4', 'Borders and dividers'),
    swatch('Muted text', '#8a8a85', 'Secondary text, captions'),
    !used.has('#1a1a1a') && !sem.bodyText ? swatch('Ink', '#1a1a1a', 'Body text, primary UI') : null,
  ])
  colors.push({ group: 'Surfaces & neutrals', swatches: surfaces })

  // ── Assets: real logo + imagery found on the site
  const logoAssets: AssetFile[] = []
  if (scan.logoUrl) {
    logoAssets.push({
      name: 'Logo (from your site)',
      file: scan.logoUrl,
      format: [extOf(scan.logoUrl)],
      usage: 'Found automatically — replace with your master files',
      tags: ['logo'],
    })
  }
  if (scan.faviconUrl && scan.faviconUrl !== scan.logoUrl) {
    logoAssets.push({
      name: 'Icon',
      file: scan.faviconUrl,
      format: [extOf(scan.faviconUrl)],
      usage: 'Site icon — good for avatars and favicons',
      tags: ['icon'],
    })
  }
  const imageryAssets: AssetFile[] = (scan.images || []).map((src, i) => ({
    name: `Website image ${i + 1}`,
    file: src,
    format: [extOf(src)],
    usage: 'Found on your site — keep, rename, or remove',
    tags: ['from-website'],
  }))

  // ── Typography: heading + body faces, with the site's real sizes when found
  const h1Size = scan.headingSize || '36px'
  const bodySize = scan.bodySize || '15px'
  const fonts = []
  if (headingFont && headingFont !== bodyFont) {
    fonts.push({
      name: headingFont,
      role: 'Display typeface',
      weights: ['500', '600', '700'],
      usage: `Headlines and display moments · H1 on your site: ${h1Size}`,
      importUrl: googleFontUrl(headingFont, ['500', '600', '700']),
      specimens: [
        { label: 'Display', size: h1Size, weight: '700', sample: tagline },
        { label: 'Heading', size: '22px', weight: '600', sample: `${name} brand guidelines` },
      ],
    })
  }
  fonts.push({
    name: bodyFont,
    role: fonts.length ? 'Text typeface' : 'Primary typeface',
    weights: ['400', '500', '600', '700'],
    usage: fonts.length ? `Body copy, UI, captions · base size on your site: ${bodySize}` : 'Headlines, body copy, and UI',
    importUrl: googleFontUrl(bodyFont, ['400', '500', '600', '700']),
    specimens: [
      ...(fonts.length ? [] : [
        { label: 'Display', size: h1Size, weight: '700', sample: tagline },
        { label: 'Heading', size: '22px', weight: '600', sample: `${name} brand guidelines` },
      ]),
      { label: 'Body', size: bodySize, weight: '400', sample: 'Everything you need to represent our brand, in one place.' },
      { label: 'Caption', size: '12px', weight: '500', sample: 'BRAND ASSETS · UPDATED TODAY' },
    ],
  })

  return {
    slug: slugify(name) || 'brand',
    name,
    tagline,
    logoUrl: scan.logoUrl || scan.faviconUrl || undefined,
    website: scan.originalUrl || undefined,

    colors,
    typography: [{ group: 'Brand typefaces', fonts }],

    sections: [
      { id: 'logo', label: 'Logo', type: 'assets', icon: 'logo' },
      { id: 'colors', label: 'Colors', type: 'colors', icon: 'colors' },
      { id: 'typography', label: 'Typography', type: 'typography', icon: 'type' },
      { id: 'imagery', label: 'Imagery', type: 'assets', icon: 'screenshots' },
      { id: 'guidelines', label: 'Guidelines', type: 'guidelines', icon: 'guidelines' },
    ],

    assets: {
      logo: logoAssets,
      imagery: imageryAssets,
    },

    guidelines: {
      voice: {
        title: 'Brand voice',
        description: `How ${name} speaks and writes. Edit these principles to match your voice.`,
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
      greeting: `Ask me anything about the ${name} brand — colors, logo usage, typography, tone of voice.`,
      model: 'claude-haiku-4-5-20251001',
    },
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function extOf(url: string): string {
  const m = url.match(/\.([a-z0-9]{2,5})(\?|$)/i)
  return (m?.[1] || 'img').toUpperCase()
}

function cleanFontName(v: string | undefined): string {
  const name = (v || '').split(',')[0].replace(/['"]/g, '').trim()
  if (!name || /^(ui-)?(sans-serif|serif|monospace|system-ui)$/i.test(name)) return 'Inter'
  return name.replace(/\b\w/g, ch => ch.toUpperCase())
}

function googleFontUrl(name: string, weights: string[]): string {
  const family = name.trim().replace(/ /g, '+')
  return `https://fonts.googleapis.com/css2?family=${family}:wght@${weights.join(';')}&display=swap`
}
