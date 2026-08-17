import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/**
 * The pages worth indexing — all of them public by design.
 *
 * Client hubs are deliberately absent: listing them here would hand crawlers
 * the very addresses the rest of the setup keeps out of search.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // The root just forwards to the dashboard or the sign-in form, so it is
    // not a page a crawler should be sent to. The pitch lives on the marketing
    // site, which publishes its own sitemap.
    { url: `${SITE_URL}/demo`, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/login`, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
