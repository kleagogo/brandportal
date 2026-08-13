/**
 * Share-portal analytics — who opened a link and what they took.
 *
 * Deliberately small: per-portal counters plus a short activity tail, stored
 * through the same driver as everything else (namespace 'portal-stats').
 * No visitor identity is kept — just counts, timestamps, and file labels.
 */

import { getStorage } from './db'

export type PortalEventType = 'view' | 'download'

export interface PortalEvent {
  at: string
  type: PortalEventType
  /** What was downloaded, e.g. "Logo Lockup — Pine" or "Logo (.zip)". */
  label?: string
}

export interface PortalStats {
  views: number
  downloads: number
  firstViewAt?: string
  lastViewAt?: string
  /** Newest first, capped — enough to show "recent activity". */
  recent: PortalEvent[]
}

const RECENT_LIMIT = 40

const EMPTY: PortalStats = { views: 0, downloads: 0, recent: [] }

export async function getPortalStats(portalId: string): Promise<PortalStats> {
  const stats = await getStorage().getJSON<PortalStats>('portal-stats', portalId)
  return stats ? { ...EMPTY, ...stats, recent: stats.recent || [] } : { ...EMPTY }
}

export async function recordPortalEvent(portalId: string, type: PortalEventType, label?: string): Promise<void> {
  const stats = await getPortalStats(portalId)
  const at = new Date().toISOString()

  if (type === 'view') {
    stats.views++
    stats.firstViewAt = stats.firstViewAt || at
    stats.lastViewAt = at
  } else {
    stats.downloads++
  }

  stats.recent = [{ at, type, ...(label ? { label: label.slice(0, 80) } : {}) }, ...stats.recent].slice(0, RECENT_LIMIT)
  await getStorage().putJSON('portal-stats', portalId, stats)
}

export async function deletePortalStats(portalId: string): Promise<void> {
  await getStorage().deleteJSON('portal-stats', portalId)
}
