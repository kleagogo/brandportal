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
  // The mark alone. The hub's name is written beside it in the sidebar, so a
  // lockup would set the word twice.
  logoUrl: '/brand/pitho-mark.svg',
  website: 'https://pitho.io',

  // ─── Colors ─────────────────────────────────────────────────────────────────
  colors: [
    {
      group: 'Brand colors',
      swatches: [
        { name: 'Ink',        hex: '#080C12', usage: 'The brand ground. Site background, primary buttons in the app' },
        { name: 'White',      hex: '#FFFFFF', usage: 'The wordmark and all text on Ink' },
        { name: 'Signal',     hex: '#8CFF2E', usage: 'One accent, used sparingly. Never for body text' },
      ],
    },
    {
      group: 'Surfaces',
      swatches: [
        { name: 'Surface 900', hex: '#0D0D0D', usage: 'Deepest panels' },
        { name: 'Surface 850', hex: '#0E131D', usage: 'Cards on Ink' },
        { name: 'Surface 800', hex: '#0F1520', usage: 'Raised cards, hover states' },
        { name: 'Surface 750', hex: '#121926', usage: 'The lift at the top of a gradient' },
        { name: 'Zinc',        hex: '#09090B', usage: 'Neutral panel where Ink reads too blue' },
        { name: 'Line',        hex: '#2F2F2F', usage: 'Solid dividers' },
      ],
    },
    {
      group: 'Text & lines',
      swatches: [
        { name: 'Muted',      hex: '#99A0B0', usage: 'Secondary text and captions' },
        { name: 'White 70',   hex: '#FFFFFFB3', usage: 'Body copy on Ink' },
        { name: 'White 65',   hex: '#FFFFFFA6', usage: 'Supporting copy' },
        { name: 'White 50',   hex: '#FFFFFF80', usage: 'Disabled and placeholder text' },
        { name: 'Hairline',   hex: '#FFFFFF0D', usage: 'Borders and dividers on dark' },
      ],
    },
  ],

  // ─── Gradients ────────────────────────────────────────────────────────────────
  gradients: [
    {
      group: 'Gradient presets',
      gradients: [
        { name: 'Deep Field',  css: 'linear-gradient(180deg, #121926 0%, #080C12 100%)' },
        { name: 'Night Rise',  css: 'linear-gradient(180deg, #080C12 0%, #0F1520 100%)' },
        { name: 'Panel',       css: 'linear-gradient(180deg, #0E131D 0%, #09090B 100%)' },
        { name: 'Signal Edge', css: 'linear-gradient(90deg, #080C12 0%, #080C12 70%, #8CFF2E 100%)' },
        { name: 'Hairline',    css: 'linear-gradient(90deg, #FFFFFF00 0%, #FFFFFF1A 50%, #FFFFFF00 100%)' },
      ],
    },
    {
      group: 'Gradient backgrounds',
      gradients: [
        { name: 'Fill 1', css: 'radial-gradient(circle at 30% 20%, #121926 0%, #080C12 70%)', downloadable: true },
        { name: 'Fill 2', css: 'radial-gradient(circle at 80% 90%, #8CFF2E 0%, #080C12 65%)', downloadable: true },
        { name: 'Fill 3', css: 'radial-gradient(circle at 50% 0%, #0F1520 0%, #080C12 75%)',  downloadable: true },
      ],
    },
  ],

  // ─── Typography ─────────────────────────────────────────────────────────────
  typography: [
    {
      group: 'Brand typefaces',
      fonts: [
        {
          name: 'Onest',
          role: 'Display typeface',
          weights: ['400', '500', '600'],
          usage: 'The wordmark and every headline. Set it at Regular and pull the tracking in',
          primaryLabel: 'Display · Wordmark & headlines',
          cssSnippet: "font-family: 'Onest', system-ui, sans-serif;",
          importUrl: 'https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600&display=swap',
          downloads: [{ label: 'Regular' }, { label: 'Medium' }, { label: 'Semibold' }],
          specimens: [
            { label: 'Wordmark',    size: '24px', weight: '400', kerning: '-4%', lineHeight: '100%', sample: 'Pitho' },
            { label: 'Headline XL', size: '64px', weight: '400', kerning: '-4%', lineHeight: '100%', sample: 'Bring every brand into focus.' },
            { label: 'Headline L',  size: '40px', weight: '400', kerning: '-3%', lineHeight: '105%', sample: 'Your brand should not live in pieces.' },
            { label: 'Headline M',  size: '28px', weight: '500', kerning: '-2%', lineHeight: '110%', sample: 'From messy folder to client ready' },
            { label: 'Eyebrow',     size: '12px', weight: '600', kerning: '8%',  lineHeight: '120%', sample: 'HOW IT WORKS' },
          ],
        },
        {
          name: 'Inter',
          role: 'Text typeface',
          weights: ['400', '500', '600'],
          usage: 'Body copy, UI and captions. Everything that is not a headline',
          primaryLabel: 'Text · Body, UI & captions',
          cssSnippet: "font-family: 'Inter', system-ui, sans-serif;",
          importUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
          downloads: [{ label: 'Regular' }, { label: 'Medium' }, { label: 'Semibold' }],
          specimens: [
            { label: 'Paragraph L', size: '18px', weight: '400', kerning: '0%', lineHeight: '155%', sample: 'Pitho is the calm, considered home for the assets your agency creates, shares, and stands behind.' },
            { label: 'Paragraph M', size: '16px', weight: '400', kerning: '0%', lineHeight: '150%', sample: 'Pitho is the calm, considered home for the assets your agency creates, shares, and stands behind.' },
            { label: 'Paragraph S', size: '14px', weight: '400', kerning: '0%', lineHeight: '145%', sample: 'Pitho is the calm, considered home for the assets your agency creates, shares, and stands behind.' },
            { label: 'Caption',     size: '12px', weight: '500', kerning: '2%', lineHeight: '140%', sample: 'ONE HUB · EVERY ASSET · ALWAYS CURRENT' },
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
    { id: 'video',        label: 'Video',             type: 'assets',     icon: 'video',       group: 'assets' },
    { id: 'guidelines',   label: 'Guidelines',        type: 'guidelines', icon: 'guidelines',  group: 'assets' },
    { id: 'templates',    label: 'Templates',         type: 'assets',     icon: 'templates',   group: 'resources' },
    { id: 'inspiration',  label: 'Inspiration',       type: 'assets',     icon: 'sparkles',    group: 'resources' },
  ],

  // ─── Asset library ───────────────────────────────────────────────────────────
  assets: {
    logo: [
      { name: 'Logo · Ink',       file: '/brand/pitho-logo.svg',            format: ['SVG'], usage: 'Default. Focus mark and wordmark, on light surfaces', subgroup: 'Logo', tags: ['logo', 'lockup'] },
      { name: 'Logo · Reverse',   file: '/brand/pitho-logo-reverse.svg',    format: ['SVG'], usage: 'On Ink, photography and dark panels',                subgroup: 'Logo', tags: ['logo', 'lockup', 'reverse'] },
      { name: 'Focus mark · Ink',     file: '/brand/pitho-mark.svg',         format: ['SVG'], usage: 'App icon, avatar, favicon. Where the word will not fit', subgroup: 'Focus mark', tags: ['mark', 'icon'] },
      { name: 'Focus mark · Reverse', file: '/brand/pitho-mark-reverse.svg', format: ['SVG'], usage: 'The mark alone on dark surfaces',                       subgroup: 'Focus mark', tags: ['mark', 'icon', 'reverse'] },
      { name: 'Wordmark · Ink',     file: '/brand/pitho-wordmark.svg',         format: ['SVG'], usage: 'Without the mark, where the lockup is too wide', subgroup: 'Wordmark', tags: ['wordmark'] },
      { name: 'Wordmark · Reverse', file: '/brand/pitho-wordmark-reverse.svg', format: ['SVG'], usage: 'Wordmark alone on dark surfaces',               subgroup: 'Wordmark', tags: ['wordmark', 'reverse'] },
    ],
    screenshots: [],
    artwork: [
      { name: 'Deep field',  file: '/brand/art-deep-field.svg', format: ['SVG'], usage: 'Section and hero background', ratio: 'wide', tags: ['background', 'gradient'] },
      { name: 'Signal arc',  file: '/brand/art-signal-arc.svg', format: ['SVG'], usage: 'Accent background. Use once per page', ratio: 'wide', tags: ['background', 'accent'] },
      { name: 'Grid',        file: '/brand/art-grid.svg',       format: ['SVG'], usage: 'Subtle texture behind dark sections', ratio: 'wide', tags: ['pattern', 'texture'] },
      { name: 'Stack',       file: '/brand/art-stack.svg',      format: ['SVG'], usage: 'Motif for versioning and handover', ratio: 'wide', tags: ['motif', 'diagram'] },
    ],
    video: [
      { name: 'Brand film', file: '/brand/pitho-hero.mp4', format: ['MP4'], usage: 'The hero film from the site. Muted, loops, no sound design', ratio: 'wide', subgroup: 'Hero', tags: ['video', 'hero'] },
    ],
    templates: [],
    inspiration: [],
  },

  // ─── Written guidelines ──────────────────────────────────────────────────────
  guidelines: {
    voice: {
      title: 'Brand voice',
      description: 'Pitho sounds like a studio partner who has done the work: short, precise, friendly.',
      principles: [
        { name: 'Short',    description: 'One sentence where one will do. Cut anything that does not help the reader act.' },
        { name: 'Precise',  description: 'Name the real thing. A file, a version, a link. No claims we cannot show.' },
        { name: 'Friendly', description: 'Write to a person. Warm, never chatty, never salesy.' },
        { name: 'No em dashes', description: 'Use a period, a comma, a colon, or a middot for metadata like PNG · V2.' },
      ],
    },
    usage: {
      dos: [
        'Set the wordmark in Onest Regular with the tracking at -4%, six pixels from the mark',
        'Use Ink for primary buttons so the product matches the site',
        'Keep clear space around the wordmark equal to the height of its P',
        'Let Signal appear once on a screen, never in body text',
      ],
      donts: [
        'Do not redraw the focus mark or change its proportions. It is four brackets and a dot',
        'Do not set the wordmark in any face other than Onest',
        'Do not set headlines in Inter. Onest carries every headline',
        'Do not put Signal on white. It is an accent for dark surfaces only',
      ],
    },
  },

  // ─── Brand Agent ─────────────────────────────────────────────────────────────
  // Powers the AI chatbot + Home page. Set your Anthropic API key in .env.local
  agent: {
    enabled: true,
    name: 'Pitho Brand Agent',
    greeting: 'Ask me anything about the Pitho brand: colors, logo usage, typography, tone of voice.',
    home: 'Your assistant for everything Pitho brand, from guidelines to copy to finding an asset.',
    prompts: ['Review my design', 'Write on-brand copy', 'Find an asset', 'Brand quiz'],
    model: 'claude-haiku-4-5-20251001',
  },
}

export default config
