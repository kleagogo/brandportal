/**
 * Small in-memory rate limiter (per process). Enough to stop casual abuse of
 * the scan and magic-link endpoints; swap for a shared store when deployed
 * across multiple instances.
 */

const buckets = new Map<string, number[]>()

/** Returns true when the call is allowed; false when the key is over budget. */
export function allow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const hits = (buckets.get(key) || []).filter(t => now - t < windowMs)
  if (hits.length >= max) {
    buckets.set(key, hits)
    return false
  }
  hits.push(now)
  buckets.set(key, hits)
  // Opportunistic cleanup so the map doesn't grow forever.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every(t => now - t > windowMs)) buckets.delete(k)
    }
  }
  return true
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  return (fwd ? fwd.split(',')[0].trim() : '') || 'local'
}
