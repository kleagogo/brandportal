/**
 * Builds a complete BrandConfig from the lightweight scan result, so a scanned
 * site becomes a real, fully-populated hub — not a thin preview. Everything
 * generated here is a sensible starting point the owner edits after claiming.
 */

import type { BrandConfig } from '@/app/types/brand'
import { slugify } from './store'

export interface ScanResult {
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
  const fontName = cleanFontName(scan.fontFamily)
  const tagline = scan.tagline.trim() || 'One source of truth for our brand.'

  return {
    slug: slugify(name) || 'brand',
    name,
    tagline,
    logoUrl: scan.faviconUrl || undefined,
    website: scan.originalUrl || undefined,

    colors: [
      {
        group: 'Primary',
        swatches: [
          { name: 'Brand', hex: primary, usage: 'Primary actions, headlines, key surfaces' },
          { name: 'Brand 80', hex: mix(primary, '#ffffff', 0.2), usage: 'Hover states, secondary emphasis' },
          { name: 'Brand 20', hex: mix(primary, '#ffffff', 0.8), usage: 'Tints, subtle backgrounds' },
        ],
      },
      {
        group: 'Neutrals',
        swatches: [
          { name: 'White', hex: '#ffffff', usage: 'Backgrounds' },
          { name: 'Grey 100', hex: '#f4f4f2', usage: 'Page background, cards' },
          { name: 'Grey 300', hex: '#d9d8d4', usage: 'Borders, dividers' },
          { name: 'Grey 500', hex: '#8a8a85', usage: 'Secondary text, captions' },
          { name: 'Ink', hex: '#1a1a1a', usage: 'Body text, primary UI' },
        ],
      },
    ],

    typography: [
      {
        group: 'Brand typefaces',
        fonts: [
          {
            name: fontName,
            role: 'Primary typeface',
            weights: ['400', '500', '600', '700'],
            usage: 'Headlines, body copy, and UI',
            importUrl: googleFontUrl(fontName, ['400', '500', '600', '700']),
            specimens: [
              { label: 'Display', size: '36px', weight: '700', sample: tagline },
              { label: 'Heading', size: '22px', weight: '600', sample: `${name} brand guidelines` },
              { label: 'Body', size: '15px', weight: '400', sample: 'Everything you need to represent our brand, in one place.' },
              { label: 'Caption', size: '12px', weight: '500', sample: 'BRAND ASSETS · UPDATED TODAY' },
            ],
          },
        ],
      },
    ],

    sections: [
      { id: 'logo', label: 'Logo', type: 'assets', icon: 'logo' },
      { id: 'colors', label: 'Colors', type: 'colors', icon: 'colors' },
      { id: 'typography', label: 'Typography', type: 'typography', icon: 'type' },
      { id: 'imagery', label: 'Imagery', type: 'assets', icon: 'screenshots' },
      { id: 'guidelines', label: 'Guidelines', type: 'guidelines', icon: 'guidelines' },
    ],

    assets: {
      logo: scan.faviconUrl
        ? [{ name: 'Icon (from your site)', file: scan.faviconUrl, format: ['ICO'], usage: 'Found automatically — replace with your real logo files' }]
        : [],
      imagery: [],
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

function normalizeHex(v: string | undefined): string | null {
  if (!v) return null
  let h = v.trim().toLowerCase()
  if (!h.startsWith('#')) h = `#${h}`
  if (/^#[0-9a-f]{3}$/.test(h)) h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`
  if (/^#[0-9a-f]{8}$/.test(h)) h = h.slice(0, 7) // drop alpha
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

function cleanFontName(v: string | undefined): string {
  const name = (v || '').split(',')[0].replace(/['"]/g, '').trim()
  if (!name || /^(ui-)?(sans-serif|serif|monospace|system-ui)$/i.test(name)) return 'Inter'
  // Title-case multiword names the way Google Fonts expects (e.g. "open sans" → "Open Sans")
  return name.replace(/\b\w/g, ch => ch.toUpperCase())
}

function googleFontUrl(name: string, weights: string[]): string {
  const family = name.trim().replace(/ /g, '+')
  return `https://fonts.googleapis.com/css2?family=${family}:wght@${weights.join(';')}&display=swap`
}
