/**
 * brand.config.ts — the seed data for a fresh hub.
 *
 * On first run this config is loaded into the store (data/hubs/<slug>.json).
 * After that, all edits happen in the hub's edit mode and are saved to the
 * store — this file is only the starting point for new installations.
 *
 * The seed brand is Pitho itself, so the demo hub doubles as our own brand
 * hub while demonstrating every section a complete hub can hold.
 */

import type { BrandConfig } from './app/types/brand'

const config: BrandConfig = {
  // ─── Identity ───────────────────────────────────────────────────────────────
  slug: 'demo',
  name: 'Pitho',
  tagline: 'One clean brand hub for every client.',
  logoUrl: '/brand/pitho-mark.svg',
  website: 'https://pitho.io',

  // ─── Colors ─────────────────────────────────────────────────────────────────
  colors: [
    {
      group: 'Brand colors',
      swatches: [
        { name: 'Pine',       hex: '#1F3B2C', usage: 'Primary surfaces, headlines, packaging' },
        { name: 'Pine 80',    hex: '#3C5A48', usage: 'Hover states, secondary buttons' },
        { name: 'Pine 20',    hex: '#D8E2DC', usage: 'Tints, subtle backgrounds' },
        { name: 'Ember',      hex: '#D96E30', usage: 'Calls to action, highlights — use sparingly' },
        { name: 'Ember 20',   hex: '#F7E1D3', usage: 'Tags, notice backgrounds' },
        { name: 'Sky',        hex: '#5B8AA6', usage: 'Links, informational accents' },
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

  // ─── Gradients ────────────────────────────────────────────────────────────────
  gradients: [
    {
      group: 'Gradient presets',
      gradients: [
        { name: 'Horizon',     css: 'linear-gradient(90deg, #1F3B2C 0%, #3C5A48 50%, #D96E30 100%)' },
        { name: 'Dusk',        css: 'linear-gradient(90deg, #1F3B2C 0%, #5B8AA6 100%)' },
        { name: 'Ember Wash',  css: 'linear-gradient(90deg, #D96E30 0%, #F7E1D3 100%)' },
        { name: 'Vertical Horizon', css: 'linear-gradient(180deg, #1F3B2C 0%, #D96E30 100%)' },
        { name: 'Vertical Dusk',    css: 'linear-gradient(180deg, #5B8AA6 0%, #1F3B2C 100%)' },
        { name: 'Vertical Ember',   css: 'linear-gradient(180deg, #F7E1D3 0%, #D96E30 100%)' },
      ],
    },
    {
      group: 'Gradient backgrounds',
      gradients: [
        { name: 'Fill 1', css: 'radial-gradient(circle at 30% 20%, #3C5A48 0%, #1F3B2C 70%)', downloadable: true },
        { name: 'Fill 2', css: 'radial-gradient(circle at 70% 30%, #D96E30 0%, #1F3B2C 80%)', downloadable: true },
        { name: 'Fill 3', css: 'radial-gradient(circle at 50% 80%, #5B8AA6 0%, #1F3B2C 75%)', downloadable: true },
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
          weights: ['400', '500', '600', '700'],
          usage: 'Headlines, campaign work, packaging',
          primaryLabel: 'Display — Headlines & campaign work',
          cssSnippet: "font-family: 'Fraunces', Georgia, serif;",
          importUrl: 'https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&display=swap',
          downloads: [
            { label: 'Regular' }, { label: 'Regular Italic' },
            { label: 'Semibold' }, { label: 'Semibold Italic' },
            { label: 'Bold' }, { label: 'Bold Italic' },
          ],
          specimens: [
            { label: 'Headline XXL', size: '72px', weight: '600', kerning: '-3%', lineHeight: '95%', sample: 'Pitho' },
            { label: 'Headline XL',  size: '48px', weight: '600', kerning: '-3%', lineHeight: '100%', sample: 'One source of truth' },
            { label: 'Headline L',   size: '36px', weight: '600', kerning: '-2%', lineHeight: '105%', sample: 'Every asset, every version' },
            { label: 'Headline M',   size: '30px', weight: '500', kerning: '-2%', lineHeight: '110%', sample: 'Findable in seconds' },
            { label: 'Eyebrow',      size: '13px', weight: '600', kerning: '6%',  lineHeight: '120%', sample: 'BRAND NOTES' },
          ],
        },
        {
          name: 'Inter',
          role: 'Text typeface',
          weights: ['400', '500', '600'],
          usage: 'Body copy, UI, captions — everything that isn’t a headline',
          primaryLabel: 'Text — All UI, body & captions',
          cssSnippet: "font-family: 'Inter', system-ui, sans-serif;",
          importUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
          downloads: [
            { label: 'Regular' }, { label: 'Medium' }, { label: 'Semibold' },
          ],
          specimens: [
            { label: 'Paragraph L', size: '20px', weight: '400', kerning: '-1%', lineHeight: '150%', sample: 'Every Pitho hub keeps the whole brand in one place, versioned and ready to hand over.' },
            { label: 'Paragraph M', size: '16px', weight: '400', kerning: '0%',  lineHeight: '150%', sample: 'Every Pitho hub keeps the whole brand in one place, versioned and ready to hand over.' },
            { label: 'Paragraph S', size: '14px', weight: '400', kerning: '0%',  lineHeight: '145%', sample: 'Every Pitho hub keeps the whole brand in one place, versioned and ready to hand over.' },
            { label: 'Caption',     size: '12px', weight: '500', kerning: '2%',  lineHeight: '140%', sample: 'ONE HUB · EVERY ASSET · ALWAYS CURRENT' },
          ],
        },
      ],
    },
  ],

  // ─── Sidebar sections ────────────────────────────────────────────────────────
  // Types: 'home' | 'assets' | 'colors' | 'typography' | 'guidelines' | 'subbrand' | 'link'
  // Groups: 'main' | 'assets' | 'subbrands' | 'tools' | 'resources'
  sections: [
    { id: 'logo',         label: 'Logo',              type: 'assets',     icon: 'logo',        group: 'assets' },
    { id: 'colors',       label: 'Colors & Gradients', type: 'colors',    icon: 'colors',      group: 'assets' },
    { id: 'typography',   label: 'Typography',        type: 'typography', icon: 'type',        group: 'assets' },
    { id: 'screenshots',  label: 'Screenshots',       type: 'assets',     icon: 'screenshots', group: 'assets' },
    { id: 'artwork',      label: 'Artwork',           type: 'assets',     icon: 'artwork',     group: 'assets' },
    { id: 'guidelines',   label: 'Guidelines',        type: 'guidelines', icon: 'guidelines',  group: 'assets' },
    { id: 'templates',    label: 'Templates',         type: 'assets',     icon: 'templates',   group: 'resources' },
    { id: 'inspiration',  label: 'Inspiration',       type: 'assets',     icon: 'sparkles',    group: 'resources' },
  ],

  // ─── Asset library ───────────────────────────────────────────────────────────
  assets: {
    logo: [
      { name: 'Logo Lockup — Pine',  file: '/brand/pitho-logo.svg',      format: ['SVG', 'PNG', 'PDF'], usage: 'Default usage on light backgrounds', subgroup: 'Lockup', tags: ['logo'] },
      { name: 'Logo Lockup — Reverse', file: '/brand/pitho-logo-dark.svg', format: ['SVG', 'PNG', 'PDF'], usage: 'On Pine or photographic backgrounds', subgroup: 'Lockup', tags: ['logo'] },
      { name: 'Logomark — Color',    file: '/brand/pitho-mark.svg',      format: ['SVG', 'PNG', 'PDF'], usage: 'App icon, avatar, favicon',           subgroup: 'Logomark', tags: ['mark'] },
      { name: 'Logomark — Reverse',  file: '/brand/pitho-logo-dark.svg', format: ['SVG', 'PNG'],        usage: 'On dark backgrounds',                subgroup: 'Logomark', tags: ['mark'] },
      { name: 'Wordmark — Pine',     file: '/brand/pitho-logo.svg',      format: ['SVG', 'PNG', 'PDF'], usage: 'Where the mark alone is too small',   subgroup: 'Wordmark', tags: ['wordmark'] },
    ],
    screenshots: [
      { name: 'Hub — Light', file: '/brand/photo-gear.svg',  format: ['PNG'], usage: 'Product marketing, light mode', subgroup: 'Web',    ratio: 'wide', platform: 'Web', tags: ['product'] },
      { name: 'Hub — Dark',  file: '/brand/photo-coast.svg', format: ['PNG'], usage: 'Product marketing, dark mode',  subgroup: 'Web',    ratio: 'wide', platform: 'Web', tags: ['product'] },
      { name: 'App — Home',  file: '/brand/photo-trail.svg', format: ['PNG'], usage: 'Mobile home screen',            subgroup: 'Mobile', ratio: 'portrait', platform: 'iOS', tags: ['mobile'] },
      { name: 'App — Assets', file: '/brand/photo-coast.svg', format: ['PNG'], usage: 'Mobile asset browser',         subgroup: 'Mobile', ratio: 'portrait', platform: 'iOS', tags: ['mobile'] },
    ],
    artwork: [
      { name: 'Grid pattern',    file: '/brand/photo-trail.svg', format: ['SVG'], usage: 'Decorative fills, section backgrounds', tags: ['pattern'] },
      { name: 'Vessel motif',    file: '/brand/pitho-mark.svg', format: ['SVG'], usage: 'Badges, stamps, watermarks',           tags: ['icon', 'motif'] },
      { name: 'Spot illustration', file: '/brand/photo-coast.svg', format: ['SVG'], usage: 'Editorial spot illustration',        tags: ['illustration'] },
    ],
    templates: [
      { name: 'Instagram post',  file: 'https://figma.com', format: ['Figma'], usage: 'Square 1080×1080 social template', external: true, ratio: 'square', platform: 'Social', tags: ['social'] },
      { name: 'Email header',    file: 'https://figma.com', format: ['Figma'], usage: 'Newsletter banner template',       external: true, ratio: 'wide', platform: 'Email', tags: ['email'] },
      { name: 'Event flyer',     file: 'https://figma.com', format: ['Figma'], usage: 'A5 print + digital flyer',          external: true, ratio: 'portrait', platform: 'Print', tags: ['print'] },
    ],
    inspiration: [
      { name: 'Campaign — Handover', file: '/brand/photo-trail.svg', format: ['JPG'], usage: 'Launch campaign key visual', ratio: 'portrait', tags: ['campaign'] },
      { name: 'Identity study',      file: '/brand/photo-gear.svg',  format: ['JPG'], usage: 'Mark and lockup exploration', ratio: 'square', tags: ['identity'] },
      { name: 'Editorial shoot',     file: '/brand/photo-coast.svg', format: ['JPG'], usage: 'Editorial photography',       ratio: 'portrait', tags: ['photography'] },
      { name: 'Conference poster',   file: '/brand/photo-trail.svg', format: ['JPG'], usage: 'Event poster concept',        ratio: 'portrait', tags: ['poster'] },
    ],
  },

  // ─── Written guidelines ──────────────────────────────────────────────────────
  guidelines: {
    voice: {
      title: 'Brand voice',
      description: 'Pitho speaks like a trusted studio partner: practical, honest, quietly confident.',
      principles: [
        { name: 'Grounded',  description: 'We talk about real work, real files, real deadlines. No superlatives we can’t prove.' },
        { name: 'Direct',    description: 'Short sentences. Concrete claims. We respect the reader’s time.' },
        { name: 'Warm',      description: 'Design is human. We write to a person, not a demographic.' },
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
  // Powers the AI chatbot + Home page. Set your Anthropic API key in .env.local
  agent: {
    enabled: true,
    name: 'Pitho Brand Agent',
    greeting: 'Ask me anything about the Pitho brand — colors, logo usage, typography, tone of voice.',
    home: 'Your AI-powered assistant for everything Pitho brand — from guidelines to copy to asset discovery.',
    prompts: ['Review my design', 'Write on-brand copy', 'Find an asset', 'Brand quiz'],
    model: 'claude-haiku-4-5-20251001',
  },
}

export default config
