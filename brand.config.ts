/**
 * brand.config.ts — the seed data for a fresh hub.
 *
 * On first run this config is loaded into the store (data/hubs/<slug>.json).
 * After that, all edits happen in the hub's edit mode and are saved to the
 * store — this file is only the starting point for new installations.
 *
 * The seed brand is "Meridian", a fictional travel-gear company, so the demo
 * hub demonstrates every section a complete brand hub can hold.
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
            { label: 'Headline XXL', size: '72px', weight: '600', kerning: '-3%', lineHeight: '95%', sample: 'Meridian' },
            { label: 'Headline XL',  size: '48px', weight: '600', kerning: '-3%', lineHeight: '100%', sample: 'The long way round' },
            { label: 'Headline L',   size: '36px', weight: '600', kerning: '-2%', lineHeight: '105%', sample: 'Built to outlast the itinerary' },
            { label: 'Headline M',   size: '30px', weight: '500', kerning: '-2%', lineHeight: '110%', sample: 'Field-tested, season after season' },
            { label: 'Eyebrow',      size: '13px', weight: '600', kerning: '6%',  lineHeight: '120%', sample: 'FIELD NOTES' },
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
            { label: 'Paragraph L', size: '20px', weight: '400', kerning: '-1%', lineHeight: '150%', sample: 'Every Meridian product is tested on the road for a full season before it ships.' },
            { label: 'Paragraph M', size: '16px', weight: '400', kerning: '0%',  lineHeight: '150%', sample: 'Every Meridian product is tested on the road for a full season before it ships.' },
            { label: 'Paragraph S', size: '14px', weight: '400', kerning: '0%',  lineHeight: '145%', sample: 'Every Meridian product is tested on the road for a full season before it ships.' },
            { label: 'Caption',     size: '12px', weight: '500', kerning: '2%',  lineHeight: '140%', sample: 'FIELD-TESTED · GUARANTEED FOR LIFE' },
          ],
        },
      ],
    },
  ],

  // ─── Sidebar sections ────────────────────────────────────────────────────────
  // Types: 'home' | 'assets' | 'colors' | 'typography' | 'guidelines' | 'subbrand' | 'link'
  // Groups: 'main' | 'assets' | 'subbrands' | 'tools' | 'resources'
  sections: [
    { id: 'home',         label: 'Home',              type: 'home',       icon: 'home',        group: 'main' },
    { id: 'logo',         label: 'Logo',              type: 'assets',     icon: 'logo',        group: 'assets' },
    { id: 'colors',       label: 'Colors & Gradients', type: 'colors',    icon: 'colors',      group: 'assets' },
    { id: 'typography',   label: 'Typography',        type: 'typography', icon: 'type',        group: 'assets' },
    { id: 'screenshots',  label: 'Screenshots',       type: 'assets',     icon: 'screenshots', group: 'assets' },
    { id: 'artwork',      label: 'Artwork',           type: 'assets',     icon: 'artwork',     group: 'assets' },
    { id: 'guidelines',   label: 'Guidelines',        type: 'guidelines', icon: 'guidelines',  group: 'assets' },
    { id: 'trailhead',    label: 'Trailhead',         type: 'subbrand',   icon: 'heart',       group: 'subbrands' },
    { id: 'email-sig',    label: 'Email Signature',   type: 'link',       icon: 'mail',        group: 'tools',      url: 'https://meridian.example/email-signature' },
    { id: 'new-member',   label: 'New Team Member',   type: 'link',       icon: 'person',      group: 'tools',      url: 'https://meridian.example/onboarding' },
    { id: 'templates',    label: 'Templates',         type: 'assets',     icon: 'templates',   group: 'resources' },
    { id: 'inspiration',  label: 'Inspiration',       type: 'assets',     icon: 'sparkles',    group: 'resources' },
  ],

  // ─── Asset library ───────────────────────────────────────────────────────────
  assets: {
    logo: [
      { name: 'Logo Lockup — Pine',  file: '/brand/meridian-logo.svg',      format: ['SVG', 'PNG', 'PDF'], usage: 'Default usage on light backgrounds', subgroup: 'Lockup', tags: ['logo'] },
      { name: 'Logo Lockup — Reverse', file: '/brand/meridian-logo-dark.svg', format: ['SVG', 'PNG', 'PDF'], usage: 'On Pine or photographic backgrounds', subgroup: 'Lockup', tags: ['logo'] },
      { name: 'Logomark — Color',    file: '/brand/meridian-mark.svg',      format: ['SVG', 'PNG', 'PDF'], usage: 'App icon, avatar, favicon',           subgroup: 'Logomark', tags: ['mark'] },
      { name: 'Logomark — Reverse',  file: '/brand/meridian-logo-dark.svg', format: ['SVG', 'PNG'],        usage: 'On dark backgrounds',                subgroup: 'Logomark', tags: ['mark'] },
      { name: 'Wordmark — Pine',     file: '/brand/meridian-logo.svg',      format: ['SVG', 'PNG', 'PDF'], usage: 'Where the mark alone is too small',   subgroup: 'Wordmark', tags: ['wordmark'] },
    ],
    screenshots: [
      { name: 'Hub — Light', file: '/brand/photo-gear.svg',  format: ['PNG'], usage: 'Product marketing, light mode', subgroup: 'Web',    ratio: 'wide', platform: 'Web', tags: ['product'] },
      { name: 'Hub — Dark',  file: '/brand/photo-coast.svg', format: ['PNG'], usage: 'Product marketing, dark mode',  subgroup: 'Web',    ratio: 'wide', platform: 'Web', tags: ['product'] },
      { name: 'App — Home',  file: '/brand/photo-trail.svg', format: ['PNG'], usage: 'Mobile home screen',            subgroup: 'Mobile', ratio: 'portrait', platform: 'iOS', tags: ['mobile'] },
      { name: 'App — Trip',  file: '/brand/photo-coast.svg', format: ['PNG'], usage: 'Mobile trip planner',           subgroup: 'Mobile', ratio: 'portrait', platform: 'iOS', tags: ['mobile'] },
    ],
    artwork: [
      { name: 'Route pattern',   file: '/brand/photo-trail.svg', format: ['SVG'], usage: 'Decorative fills, packaging interiors', tags: ['pattern'] },
      { name: 'Compass motif',   file: '/brand/meridian-mark.svg', format: ['SVG'], usage: 'Badges, stamps, watermarks',           tags: ['icon', 'motif'] },
      { name: 'Coast illustration', file: '/brand/photo-coast.svg', format: ['SVG'], usage: 'Editorial spot illustration',        tags: ['illustration'] },
    ],
    templates: [
      { name: 'Instagram post',  file: 'https://figma.com', format: ['Figma'], usage: 'Square 1080×1080 social template', external: true, ratio: 'square', platform: 'Social', tags: ['social'] },
      { name: 'Email header',    file: 'https://figma.com', format: ['Figma'], usage: 'Newsletter banner template',       external: true, ratio: 'wide', platform: 'Email', tags: ['email'] },
      { name: 'Event flyer',     file: 'https://figma.com', format: ['Figma'], usage: 'A5 print + digital flyer',          external: true, ratio: 'portrait', platform: 'Print', tags: ['print'] },
    ],
    inspiration: [
      { name: 'Campaign — Long Way', file: '/brand/photo-trail.svg', format: ['JPG'], usage: 'Spring campaign key visual', ratio: 'portrait', tags: ['campaign'] },
      { name: 'Packaging study',     file: '/brand/photo-gear.svg',  format: ['JPG'], usage: 'Box and label exploration',  ratio: 'square', tags: ['packaging'] },
      { name: 'Coastline shoot',     file: '/brand/photo-coast.svg', format: ['JPG'], usage: 'Editorial photography',       ratio: 'portrait', tags: ['photography'] },
      { name: 'Trail poster',        file: '/brand/photo-trail.svg', format: ['JPG'], usage: 'Retail poster concept',       ratio: 'portrait', tags: ['poster'] },
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
  // Powers the AI chatbot + Home page. Set your Anthropic API key in .env.local
  agent: {
    enabled: true,
    name: 'Meridian Brand Agent',
    greeting: 'Ask me anything about the Meridian brand — colors, logo usage, typography, tone of voice.',
    home: 'Your AI-powered assistant for everything Meridian brand — from guidelines to copy to asset discovery.',
    prompts: ['Review my design', 'Write on-brand copy', 'Find an asset', 'Brand quiz'],
    model: 'claude-haiku-4-5-20251001',
  },
}

export default config
