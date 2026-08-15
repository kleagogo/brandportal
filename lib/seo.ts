/**
 * Shared search-engine settings.
 *
 * Client hubs live at the site root (`/[slug]`), so robots.txt can't fence
 * them off without also fencing off the homepage. That makes the per-page
 * `noindex` below the real protection rather than a belt-and-braces extra —
 * anything holding someone else's brand must carry it.
 *
 * Env:
 *   SITE_URL   canonical origin, e.g. https://pitho.io
 */

import type { Metadata } from 'next'

export const SITE_URL = (process.env.SITE_URL || 'https://pitho.io').replace(/\/+$/, '')

/** Keeps a page out of every search index, and out of link previews. */
export const PRIVATE_PAGE: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
}
