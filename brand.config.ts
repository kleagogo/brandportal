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
  // The app icon: the mark in white on the brand's own ground. The hub's name
  // is written beside it in the sidebar, so a lockup would set the word twice.
  logoUrl: '/brand/pitho-icon.svg',
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
    { id: 'brand-story',       label: 'Brand Story',            type: 'doc', icon: 'book',        group: 'assets' },
    { id: 'brand-personality', label: 'Brand Personality',      type: 'doc', icon: 'fingerprint', group: 'assets' },
    { id: 'visual-identity',   label: 'Visual Identity',        type: 'doc', icon: 'eye',         group: 'assets' },
    { id: 'brand-voice',       label: 'Brand Voice',            type: 'doc', icon: 'chat',        group: 'assets' },
    { id: 'photography',       label: 'Photography Guidelines', type: 'doc', icon: 'camera',      group: 'assets' },

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

  // The written half of the book. Pitho's own, so the demo shows what belongs
  // in each of these rather than five empty pages.
  docs: {
    'brand-story': {
      body: `Brand files scatter. A logo lives in a Drive folder, the hex sits in a Figma comment, and the one person who knows which version is current is on holiday.\n\nPitho is the address you send instead. One link per client, always current, and nobody has to ask.`,
    },
    'brand-personality': {
      body: `Precise. We name the real thing — a file, a version, a hex — and we do not round it off.\n\nCalm. The work is already stressful. Pitho is the part that is not.\n\nUseful before clever. A feature that saves a message is worth more than one that photographs well.\n\nWhat we are not: playful for its own sake, breathless about AI, or loud.`,
    },
    'visual-identity': {
      body: `The focus mark is four brackets and a dot — the act of bringing something into focus, which is the whole product in one shape.\n\nInk carries almost everything. Signal appears once on a screen, never in body text. Surfaces do the quiet work of separating panels without drawing a line.\n\nOnest sets the wordmark and headlines with the tracking pulled in. Inter does everything else.`,
    },
    'brand-voice': {
      body: `Short, precise, friendly. Write to one person who is busy.\n\nSay what a thing does, not what it enables. "One link per client" beats "a unified brand experience platform".\n\nNo em dashes in the product. A period, a comma, a colon, or a middot for metadata like PNG · V2.\n\nNever claim a feature exists before it does.`,
    },
    'photography': {
      body: `Real work, photographed plainly: a studio wall, a printed proof, a screen mid-edit. No stock handshakes, no laptops on beaches.\n\nNatural light, one source. Let shadows sit where they fall.\n\nColour stays close to Ink and the surfaces. Signal may appear as an object in frame, never as a filter over one.\n\nCrop tight enough that the subject is obvious at a glance.`,
    },
  },

  // ─── Asset library ───────────────────────────────────────────────────────────
  assets: {
    logo: [
      { name: 'Logo · Ink',       file: '/brand/pitho-logo.svg',            format: ['SVG'], usage: 'Default. Focus mark and wordmark, on light surfaces', subgroup: 'Logo', tags: ['logo', 'lockup'] },
      { name: 'Logo · Reverse',   file: '/brand/pitho-logo-reverse.svg',    format: ['SVG'], usage: 'On Ink, photography and dark panels',                subgroup: 'Logo', tags: ['logo', 'lockup', 'reverse'] },
      {
        name: 'App icon', file: '/brand/pitho-icon.svg', format: ['SVG'],
        usage: 'The standard mark: white on Ink, rounded. Avatars, favicons, app tiles',
        subgroup: 'Focus mark', tags: ['mark', 'icon'],
        // A real history, so the demo shows what replacing a file does rather
        // than leaving versions as a feature nobody can find.
        approvedVersion: 'v2',
        versions: [
          { label: 'v1', file: '/brand/pitho-mark.svg', format: 'SVG', uploadedAt: '2026-07-02T10:00:00.000Z', note: 'Bare mark, no ground' },
          { label: 'v2', file: '/brand/pitho-icon.svg', format: 'SVG', uploadedAt: '2026-08-16T09:30:00.000Z', note: 'On Ink, rounded' },
        ],
      },
      { name: 'Focus mark · Ink',     file: '/brand/pitho-mark.svg',         format: ['SVG'], usage: 'The bare mark, where you supply your own ground', subgroup: 'Focus mark', tags: ['mark', 'icon'] },
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
