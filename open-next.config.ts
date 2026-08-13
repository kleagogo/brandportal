import { defineCloudflareConfig } from '@opennextjs/cloudflare'

/**
 * Runs the Next app on Cloudflare Workers.
 *
 * Pages are dynamic (hubs must reflect the latest edit), so there's no
 * incremental cache to configure — the defaults are what we want.
 */
export default defineCloudflareConfig()
