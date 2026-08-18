/**
 * studio-north.config.ts — the example client hub.
 *
 * The demo hub holds Pitho's own brand, which shows what one hub contains but
 * never shows the thing the product is actually for: an agency running a hub
 * per client. Studio North is that second hub. It is openly fictional, it is
 * a studio rather than a coffee roaster because Pitho's clients are studios,
 * and it carries a full kit so the switcher lands somewhere worth arriving at.
 *
 * It has no meta record, so `getMeta` reports it as a demo and every visitor
 * gets the sandbox: edits show up, nothing is written, the next visitor sees
 * it clean.
 *
 * The slug carries a `demo-` prefix deliberately. A stored hub always wins in
 * `getHub`, so an unprefixed name like `studio-north` could sit on top of a
 * real customer hub — and the public-demo metadata that goes with a demo slug
 * would then publish that customer's brand to Google.
 */

import type { BrandConfig } from './app/types/brand'

const A = '/brand/studio-north'

const config: BrandConfig = {
  slug: 'demo-studio-north',
  name: 'Studio North',
  tagline: 'Brand and identity, from the harbour up.',
  logoUrl: `${A}/mark-slate.svg`,
  website: 'https://studionorth.example',

  // ─── Colors ─────────────────────────────────────────────────────────────────
  colors: [
    {
      group: 'Core',
      swatches: [
        { name: 'Slate',  hex: '#1C3A4A', usage: 'The primary. Wordmark, headings, body text' },
        { name: 'Copper', hex: '#C2683C', usage: 'The accent. Rules, labels, one highlight per page' },
        { name: 'Bone',   hex: '#EEF0EF', usage: 'The ground. Page and card backgrounds' },
      ],
    },
    {
      group: 'Supporting',
      swatches: [
        { name: 'Slate 70', hex: '#1C3A4AB3', usage: 'Body copy on Bone' },
        { name: 'Slate 40', hex: '#1C3A4A66', usage: 'Captions and metadata' },
        { name: 'Hairline', hex: '#1C3A4A1A', usage: 'Dividers and card borders' },
        { name: 'Harbour',  hex: '#2E5C6E', usage: 'Charts and secondary fills only' },
      ],
    },
  ],

  // ─── Typography ─────────────────────────────────────────────────────────────
  typography: [
    {
      group: 'Typefaces',
      fonts: [
        {
          name: 'Georgia',
          role: 'Display',
          weights: ['Regular', 'Italic', 'Bold'],
          usage: 'Every headline and the wordmark. Never below 20px.',
          primaryLabel: 'Primary — Headlines & wordmark',
          cssSnippet: "font-family: Georgia, 'Times New Roman', serif;",
          specimens: [
            { label: 'Display',  size: '38px', weight: 'Regular', lineHeight: '110%', sample: 'Copperline Coffee' },
            { label: 'Heading',  size: '24px', weight: 'Regular', lineHeight: '120%', sample: 'Identity, packaging, and a system that holds' },
          ],
        },
        {
          name: 'Inter',
          role: 'Text',
          weights: ['Regular', 'Medium', 'Semibold'],
          usage: 'Body copy, labels, and the spaced capitals under the wordmark.',
          importUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
          cssSnippet: "font-family: Inter, system-ui, sans-serif;",
          specimens: [
            { label: 'Body',  size: '15px', weight: 'Regular', lineHeight: '150%', sample: 'We build identities that survive contact with a real production schedule.' },
            { label: 'Label', size: '11px', weight: 'Medium', kerning: '4%', sample: 'CASE STUDY' },
          ],
        },
      ],
    },
  ],

  // ─── Sections ───────────────────────────────────────────────────────────────
  sections: [
    { id: 'logo',        label: 'Logo',               type: 'assets',     icon: 'logo',        group: 'assets' },
    { id: 'colors',      label: 'Colors',             type: 'colors',     icon: 'colors',      group: 'assets' },
    { id: 'typography',  label: 'Typography',         type: 'typography', icon: 'type',        group: 'assets' },
    { id: 'photography', label: 'Photography',        type: 'assets',     icon: 'artwork',     group: 'assets' },
    { id: 'motion',      label: 'Motion',             type: 'assets',     icon: 'video',       group: 'assets' },
    { id: 'guidelines',  label: 'Guidelines',         type: 'guidelines', icon: 'guidelines',  group: 'assets' },
    { id: 'templates',   label: 'Templates',          type: 'assets',     icon: 'templates',   group: 'resources' },
    { id: 'work',        label: 'Case studies',       type: 'assets',     icon: 'sparkles',    group: 'resources' },
  ],

  // ─── Asset library ──────────────────────────────────────────────────────────
  assets: {
    logo: [
      { name: 'Wordmark · Slate',    file: `${A}/wordmark-slate.svg`,    format: ['SVG'], usage: 'Default lockup. On Bone and other light grounds', subgroup: 'Wordmark', tags: ['logo', 'lockup'] },
      { name: 'Wordmark · Reversed', file: `${A}/wordmark-reversed.svg`, format: ['SVG'], usage: 'On Slate, photography, and dark panels',           subgroup: 'Wordmark', tags: ['logo', 'lockup', 'reverse'] },
      { name: 'Wordmark · Mono',     file: `${A}/wordmark-mono.svg`,     format: ['SVG'], usage: 'Single-colour print, embossing, and fax-grade reproduction', subgroup: 'Wordmark', tags: ['logo', 'mono'] },
      { name: 'Mark · Slate',        file: `${A}/mark-slate.svg`,        format: ['SVG'], usage: 'The compass alone. Avatars, favicons, app tiles',  subgroup: 'Mark', tags: ['mark', 'icon'] },
      { name: 'Mark · Copper',       file: `${A}/mark-copper.svg`,       format: ['SVG'], usage: 'Accent contexts only. Never beside the Slate mark', subgroup: 'Mark', tags: ['mark', 'icon'] },
      { name: 'Mark · Reversed',     file: `${A}/mark-reversed.svg`,     format: ['SVG'], usage: 'The mark on dark grounds',                          subgroup: 'Mark', tags: ['mark', 'icon', 'reverse'] },
    ],
    photography: [
      { name: 'Harbour',   file: `${A}/photo-harbour.svg`,   format: ['SVG'], usage: 'Hero imagery. The house scene', ratio: 'wide', tags: ['photography', 'hero'] },
      { name: 'Ridgeline', file: `${A}/photo-ridgeline.svg`, format: ['SVG'], usage: 'Section breaks and covers',      ratio: 'wide', tags: ['photography'] },
      { name: 'Studio',    file: `${A}/photo-studio.svg`,    format: ['SVG'], usage: 'About pages and team contexts',  ratio: 'wide', tags: ['photography', 'team'] },
    ],
    motion: [
      { name: 'Logo build',  file: `${A}/motion-logo-build.svg`,  format: ['SVG'], usage: 'Opening sting. 1.2s, ease-out, never looped', ratio: 'wide', subgroup: 'Titles', tags: ['motion'] },
      { name: 'Lower third', file: `${A}/motion-lower-third.svg`, format: ['SVG'], usage: 'Name plates in film and interviews',           ratio: 'wide', subgroup: 'Titles', tags: ['motion'] },
    ],
    templates: [
      { name: 'Letterhead', file: `${A}/template-letterhead.svg`, format: ['SVG'], usage: 'A4 correspondence',            ratio: 'portrait', tags: ['template', 'print'] },
      { name: 'Business card', file: `${A}/template-card.svg`,    format: ['SVG'], usage: '85 × 55mm, Copper edge stain', tags: ['template', 'print'] },
      { name: 'Social post', file: `${A}/template-social.svg`,    format: ['SVG'], usage: '1080 × 1080 announcement',     tags: ['template', 'social'] },
      { name: 'Signature · Mari', file: `${A}/signature-mari.svg`, format: ['SVG'], usage: 'Email signature block',       subgroup: 'Email', tags: ['template', 'email'] },
      { name: 'Signature · Ove',  file: `${A}/signature-ove.svg`,  format: ['SVG'], usage: 'Email signature block',       subgroup: 'Email', tags: ['template', 'email'] },
    ],
    work: [
      { name: 'Copperline Coffee', file: `${A}/case-copperline.svg`, format: ['SVG'], usage: 'Identity and packaging, 2026', ratio: 'wide', tags: ['case study'] },
      { name: 'Northtrail',        file: `${A}/case-northtrail.svg`, format: ['SVG'], usage: 'Identity and wayfinding, 2026', ratio: 'wide', tags: ['case study'] },
      { name: 'Capabilities deck', file: `${A}/deck-capabilities.svg`, format: ['SVG'], usage: 'The studio introduction', ratio: 'wide', subgroup: 'Decks', tags: ['deck'] },
      { name: 'Proposal deck',     file: `${A}/deck-proposal.svg`,     format: ['SVG'], usage: 'Scope and pricing shell',  ratio: 'wide', subgroup: 'Decks', tags: ['deck'] },
    ],
  },

  // ─── Written guidelines ─────────────────────────────────────────────────────
  guidelines: {
    voice: {
      title: 'Voice',
      description: 'Studio North writes the way it designs: plainly, and with the work in front of it.',
      principles: [
        { name: 'Say the thing',    description: 'Lead with what was made and for whom. The reasoning can follow.' },
        { name: 'No weather words', description: 'Skip "bespoke", "curated", "elevated". They describe nothing.' },
        { name: 'Credit the client', description: 'The brand is theirs. We built it; we do not own it.' },
      ],
    },
    usage: {
      dos: [
        'Give the wordmark clear space of one compass width on every side.',
        'Set headlines in Georgia and everything else in Inter.',
        'Use Copper once per layout, as a rule, label, or single highlight.',
        'Place the reversed mark on Slate or on the darker half of a photograph.',
      ],
      donts: [
        'Do not recolour the mark outside Slate, Copper, and reversed.',
        'Do not set the wordmark below 120px wide, where the capitals close up.',
        'Do not stretch, rotate, or add a shadow to the compass.',
        'Do not pair Copper with Harbour; they muddy at small sizes.',
      ],
    },
  },

  // ─── Brand agent ────────────────────────────────────────────────────────────
  agent: {
    enabled: true,
    name: 'North',
    greeting: 'Ask me anything about the Studio North brand.',
    model: 'claude-sonnet-5',
    home: 'Everything Studio North hands to a client, in one place.',
    prompts: [
      'Which logo do I use on a dark background?',
      'What are the brand colours?',
      'Can I use Copper for body text?',
    ],
  },
}

export default config
