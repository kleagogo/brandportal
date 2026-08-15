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
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/demo`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/login`, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
