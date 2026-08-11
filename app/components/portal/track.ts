'use client'

/**
 * Portal analytics beacons — best-effort and never in the viewer's way.
 *
 * Downloads are reported from the click rather than the server, so files that
 * live outside the app (blob storage) still get counted.
 */
export function trackPortal(portalId: string | undefined, type: 'view' | 'download', label?: string): void {
  if (!portalId) return
  const url = `/api/portals/${encodeURIComponent(portalId)}/event`
  const body = JSON.stringify({ type, label })
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
      return
    }
  } catch { /* fall through to fetch */ }
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
}

/** Count a view once per browser session, so a refresh isn't a new visitor. */
export function trackPortalView(portalId: string): void {
  const key = `bp_seen_${portalId}`
  try {
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch { /* private mode — count it anyway */ }
  trackPortal(portalId, 'view')
}
