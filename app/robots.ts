import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/**
 * What crawlers may look at.
 *
 * Only the marketing pages and the demo are public. Client hubs and share
 * portals hold work that belongs to someone else — a brand that hasn't
 * launched yet is exactly the sort of thing that must not turn up in a search
 * result. Those pages also send `noindex` themselves; this file is the first
 * line, not the only one.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/demo', '/login'],
        disallow: [
          '/api/',
          '/dashboard',
          '/settings',
          '/welcome',
          '/s/', // share portals
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
