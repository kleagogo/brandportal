/**
 * Shared search-engine settings.
 *
 * Client hubs live at the site root (`/[slug]`), so robots.txt can't fence
 * them off without also fencing off the homepage. That makes the per-page
 * `noindex` below the real protection rather than a belt-and-braces extra —
 * anything holding someone else's brand must carry it.
 *
 * Env:
 *   SITE_URL   canonical origin for this app, e.g. https://app.pitho.io
 */

import type { Metadata } from 'next'

/**
 * Where this app is served. The marketing site took the apex domain, so every
 * canonical URL, link preview and sitemap entry has to say app.pitho.io or it
 * advertises an address that now belongs to a different site.
 */
export const SITE_URL = (process.env.SITE_URL || 'https://app.pitho.io').replace(/\/+$/, '')

/** The marketing site, which is a separate build on the apex domain. */
export const MARKETING_URL = 'https://pitho.io'

/** Keeps a page out of every search index, and out of link previews. */
export const PRIVATE_PAGE: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
}
