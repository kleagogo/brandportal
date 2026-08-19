import type { BrandConfig } from '@/app/types/brand'

/**
 * How much a hub is allowed to hold, and how much it already does.
 *
 * The allowance is per hub rather than per account so a client with a film
 * library can be raised on its own, without handing every other space the
 * same ceiling.
 *
 * Usage is summed from the hub's own records rather than kept as a running
 * counter. A counter has to be decremented on every path that removes a file —
 * delete a card, replace a version, drop a section — and the first one that
 * forgets leaves an account paying for space it isn't using, with no way to
 * tell. A sum is always whatever is actually there.
 */

/** 15GB. Generous for a brand hub; raise a single hub with `quotaBytes`. */
export const DEFAULT_QUOTA_BYTES = 15 * 1024 * 1024 * 1024

export function quotaFor(config: BrandConfig): number {
  return config.quotaBytes && config.quotaBytes > 0 ? config.quotaBytes : DEFAULT_QUOTA_BYTES
}

/**
 * Bytes the hub is holding.
 *
 * Files uploaded before sizes were recorded count as zero — the total starts
 * a little low on older hubs and corrects itself as they are replaced. Better
 * than blocking someone on a number nobody can explain.
 */
export function usedBytes(config: BrandConfig): number {
  let total = 0
  for (const list of Object.values(config.assets || {})) {
    for (const asset of list) {
      total += asset.bytes || 0
      for (const version of asset.versions || []) total += version.bytes || 0
    }
  }
  return total
}

export interface QuotaState {
  used: number
  quota: number
  remaining: number
  percent: number
  full: boolean
}

export function quotaState(config: BrandConfig): QuotaState {
  const quota = quotaFor(config)
  const used = usedBytes(config)
  return {
    used,
    quota,
    remaining: Math.max(0, quota - used),
    percent: quota > 0 ? Math.min(100, (used / quota) * 100) : 0,
    full: used >= quota,
  }
}
