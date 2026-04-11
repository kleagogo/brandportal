/**
 * brand.config.ts — the single source of truth for your brand hub.
 *
 * Edit this file to customise every section, color, font, and asset.
 * Claude can read and update this file directly — just share the link and ask.
 *
 * Sections are fully configurable: add, remove, reorder, or rename anything.
 */

import type { BrandConfig } from './app/types/brand'

const config: BrandConfig = {
  // ─── Identity ───────────────────────────────────────────────────────────────
  name: 'Brand Hub',
  tagline: 'One source of truth for all brand assets.',
  logoUrl: '/brand/logo.svg',          // put your logo in /public/brand/
  faviconUrl: '/brand/favicon.png',
  website: 'https://yourdomain.com',

  // ─── Colors ─────────────────────────────────────────────────────────────────
  colors: [
    {
      group: 'Primary',
      swatches: [
        { name: 'Brand',     hex: '#1a1a1a', usage: 'Primary actions, headings' },
        { name: 'Brand 80',  hex: '#3d3d3d', usage: 'Hover states' },
        { name: 'Brand 20',  hex: '#d4d4d4', usage: 'Subtle backgrounds' },
      ],
    },
    {
      group: 'Accent',
      swatches: [
        { name: 'Accent',    hex: '#6366f1', usage: 'Links, highlights' },
        { name: 'Accent 20', hex: '#e0e7ff', usage: 'Tag backgrounds' },
      ],
    },
    {
      group: 'Neutrals',
      swatches: [
        { name: 'White',     hex: '#ffffff', usage: 'Backgrounds' },
        { name: 'Grey 50',   hex: '#f9f9f8', usage: 'Page background' },
        { name: 'Grey 200',  hex: '#e8e7e4', usage: 'Borders' },
        { name: 'Grey 500',  hex: '#8a8a85', usage: 'Secondary text' },
        { name: 'Black',     hex: '#1a1a1a', usage: 'Body text' },
      ],
    },
  ],

  // ─── Typography ─────────────────────────────────────────────────────────────
  typography: [
    {
      group: 'Brand',
      fonts: [
        {
          name: 'Inter',
          role: 'Primary typeface',
          weights: ['400', '500', '600', '700'],
          usage: 'All UI text, headings, body copy',
          importUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
          specimens: [
            { label: 'Display', size: '42px', weight: '700', sample: 'Your brand portal, in 30 seconds.' },
            { label: 'Heading', size: '24px', weight: '600', sample: 'Brand Assets' },
            { label: 'Body',    size: '15px', weight: '400', sample: 'Everything you need to represent your brand.' },
            { label: 'Caption', size: '12px', weight: '500', sample: 'HOW IT WORKS' },
          ],
        },
      ],
    },
  ],

  // ─── Sidebar sections ────────────────────────────────────────────────────────
  // This drives the sidebar. Add, remove, reorder freely.
  // Types: 'assets' | 'colors' | 'typography' | 'guidelines' | 'link' | 'tokens'
  sections: [
    { id: 'logo',         label: 'Logo',              type: 'assets',     icon: 'logo' },
    { id: 'colors',       label: 'Colors',            type: 'colors',     icon: 'colors' },
    { id: 'typography',   label: 'Typography',        type: 'typography', icon: 'type' },
    { id: 'screenshots',  label: 'Screenshots',       type: 'assets',     icon: 'screenshots' },
    { id: 'guidelines',   label: 'Guidelines',        type: 'guidelines', icon: 'guidelines' },
  ],

  // ─── Asset library ───────────────────────────────────────────────────────────
  // Files should live in /public/brand/
  assets: {
    logo: [
      { name: 'Logo — Primary',   file: '/brand/logo.svg',        format: ['SVG', 'PNG', 'PDF'], usage: 'Default usage on light backgrounds' },
      { name: 'Logo — White',     file: '/brand/logo-white.svg',  format: ['SVG', 'PNG'],        usage: 'On dark backgrounds' },
      { name: 'Logo — Black',     file: '/brand/logo-black.svg',  format: ['SVG', 'PNG'],        usage: 'Single colour usage' },
      { name: 'Logomark',         file: '/brand/logomark.svg',    format: ['SVG', 'PNG'],        usage: 'App icon, avatar, favicon' },
    ],
    screenshots: [
      // { name: 'Dashboard', file: '/brand/screenshots/dashboard.png', platform: 'Web', description: 'Main dashboard view' },
    ],
    guidelines: [
      // { name: 'Brand Guidelines', file: '/brand/guidelines.pdf', description: 'Full brand standards document' },
    ],
  },

  // ─── Written guidelines ──────────────────────────────────────────────────────
  guidelines: {
    voice: {
      title: 'Brand Voice',
      description: 'How we speak and write.',
      principles: [
        { name: 'Clear',      description: 'We say what we mean. No jargon, no fluff.' },
        { name: 'Confident',  description: 'We know our stuff. We don\'t hedge.' },
        { name: 'Human',      description: 'We\'re talking to people, not audiences.' },
      ],
    },
    usage: {
      dos: [
        'Use the primary logo on white or light backgrounds',
        'Maintain clear space equal to the height of the logomark around the logo',
        'Use approved color combinations only',
      ],
      donts: [
        'Don\'t stretch or distort the logo',
        'Don\'t use the logo on busy backgrounds without a container',
        'Don\'t recreate the logo in other typefaces',
      ],
    },
  },

  // ─── Brand Agent ─────────────────────────────────────────────────────────────
  // Powers the AI chatbot. Set your Anthropic API key in .env.local
  agent: {
    enabled: true,
    name: 'Brand Agent',
    greeting: 'Ask me anything about our brand — colors, logo usage, typography, tone of voice.',
    model: 'claude-haiku-4-5-20251001',
  },
}

export default config
