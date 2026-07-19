/**
 * brand.config.ts — the seed data for a fresh hub.
 *
 * On first run this config is loaded into the store (data/hub.json).
 * After that, all edits happen in the hub's edit mode and are saved to the
 * store — this file is only the starting point for new installations.
 *
 * The seed brand is "Meridian", a fictional travel-gear company, so the demo
 * hub looks real from the first visit.
 */

import type { BrandConfig } from './app/types/brand'

const config: BrandConfig = {
  // ─── Identity ───────────────────────────────────────────────────────────────
  slug: 'meridian',
  name: 'Meridian',
  tagline: 'Gear for the long way round.',
  logoUrl: '/brand/meridian-mark.svg',
  website: 'https://meridian.example',

  // ─── Colors ─────────────────────────────────────────────────────────────────
  colors: [
    {
      group: 'Primary',
      swatches: [
        { name: 'Pine',       hex: '#1F3B2C', usage: 'Primary surfaces, headlines, packaging' },
        { name: 'Pine 80',    hex: '#3C5A48', usage: 'Hover states, secondary buttons' },
        { name: 'Pine 20',    hex: '#D8E2DC', usage: 'Tints, subtle backgrounds' },
      ],
    },
    {
      group: 'Accent',
      swatches: [
        { name: 'Ember',      hex: '#D96E30', usage: 'Calls to action, highlights — use sparingly' },
        { name: 'Ember 20',   hex: '#F7E1D3', usage: 'Tags, notice backgrounds' },
      ],
    },
    {
      group: 'Neutrals',
      swatches: [
        { name: 'Paper',      hex: '#FAF8F4', usage: 'Page and app backgrounds' },
        { name: 'Sand',       hex: '#EDE7DC', usage: 'Cards, dividers, borders' },
        { name: 'Stone',      hex: '#8C877C', usage: 'Secondary text, captions' },
        { name: 'Ink',        hex: '#23211C', usage: 'Body text, primary UI' },
        { name: 'White',      hex: '#FFFFFF', usage: 'Text on dark surfaces' },
      ],
    },
  ],

  // ─── Typography ─────────────────────────────────────────────────────────────
  typography: [
    {
      group: 'Brand typefaces',
      fonts: [
        {
          name: 'Fraunces',
          role: 'Display typeface',
          weights: ['500', '600'],
          usage: 'Headlines, campaign work, packaging',
          importUrl: 'https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600&display=swap',
          specimens: [
            { label: 'Display', size: '40px', weight: '600', sample: 'The long way round.' },
            { label: 'Heading', size: '24px', weight: '500', sample: 'Built to outlast the itinerary' },
          ],
        },
        {
          name: 'Inter',
          role: 'Text typeface',
          weights: ['400', '500', '600'],
          usage: 'Body copy, UI, captions — everything that isn’t a headline',
          importUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
          specimens: [
            { label: 'Body',    size: '15px', weight: '400', sample: 'Every Meridian product is tested on the road for a full season before it ships.' },
            { label: 'Caption', size: '12px', weight: '500', sample: 'FIELD-TESTED · GUARANTEED FOR LIFE' },
          ],
        },
      ],
    },
  ],

  // ─── Sidebar sections ────────────────────────────────────────────────────────
  // This drives the sidebar. Sections can be added, renamed, and reordered in
  // edit mode. Types: 'assets' | 'colors' | 'typography' | 'guidelines' | 'link'
  sections: [
    { id: 'logo',         label: 'Logo',        type: 'assets',     icon: 'logo' },
    { id: 'colors',       label: 'Colors',      type: 'colors',     icon: 'colors' },
    { id: 'typography',   label: 'Typography',  type: 'typography', icon: 'type' },
    { id: 'photography',  label: 'Photography', type: 'assets',     icon: 'screenshots' },
    { id: 'guidelines',   label: 'Guidelines',  type: 'guidelines', icon: 'guidelines' },
  ],

  // ─── Asset library ───────────────────────────────────────────────────────────
  assets: {
    logo: [
      { name: 'Logo — Primary', file: '/brand/meridian-logo.svg',      format: ['SVG'], usage: 'Default usage on light backgrounds' },
      { name: 'Logo — Reverse', file: '/brand/meridian-logo-dark.svg', format: ['SVG'], usage: 'On Pine or photographic backgrounds' },
      { name: 'Logomark',       file: '/brand/meridian-mark.svg',      format: ['SVG'], usage: 'App icon, avatar, favicon' },
    ],
    photography: [
      { name: 'Trail at dusk',    file: '/brand/photo-trail.svg', format: ['SVG'], usage: 'Hero imagery, campaign backgrounds', tags: ['outdoors', 'landscape', 'hero'] },
      { name: 'Gear flat lay',    file: '/brand/photo-gear.svg',  format: ['SVG'], usage: 'Product pages, catalogues',         tags: ['product', 'studio'] },
      { name: 'Coastline marker', file: '/brand/photo-coast.svg', format: ['SVG'], usage: 'Editorial, about pages',            tags: ['outdoors', 'editorial'] },
    ],
  },

  // ─── Written guidelines ──────────────────────────────────────────────────────
  guidelines: {
    voice: {
      title: 'Brand voice',
      description: 'Meridian speaks like a well-travelled friend: practical, honest, quietly enthusiastic.',
      principles: [
        { name: 'Grounded',  description: 'We talk about real use, real places, real wear-and-tear. No superlatives we can’t prove.' },
        { name: 'Direct',    description: 'Short sentences. Concrete claims. We respect the reader’s time.' },
        { name: 'Warm',      description: 'Travel is human. We write to a person, not a demographic.' },
      ],
    },
    usage: {
      dos: [
        'Use the primary logo on Paper or light photographic backgrounds',
        'Keep clear space equal to the height of the logomark on all sides',
        'Pair Pine with Ember only for calls to action',
      ],
      donts: [
        'Don’t stretch, rotate, or recolor the logo',
        'Don’t set headlines in Inter — Fraunces is the display voice',
        'Don’t place Ember text on Pine backgrounds',
      ],
    },
  },

  // ─── Brand Agent ─────────────────────────────────────────────────────────────
  // Powers the AI chatbot. Set your Anthropic API key in .env.local
  agent: {
    enabled: true,
    name: 'Brand Agent',
    greeting: 'Ask me anything about the Meridian brand — colors, logo usage, typography, tone of voice.',
    model: 'claude-haiku-4-5-20251001',
  },
}

export default config
