import { defineCloudflareConfig } from '@opennextjs/cloudflare'

/**
 * Runs the Next app on Cloudflare Workers.
 *
 * Pages are dynamic (hubs must reflect the latest edit), so there's no
 * incremental cache to configure — the defaults are what we want.
 */
export default {
  ...defineCloudflareConfig(),
  // OpenNext shells out to `npm run build` by default, but that script *is*
  // `opennextjs-cloudflare build` — which would re-enter here forever. Point it
  // at the Next build directly so `npm run build` stays the one-liner that
  // Cloudflare's build config calls.
  buildCommand: 'next build',
}
