/**
 * Hub store — hubs, ownership meta, and share portals.
 *
 * All persistence goes through the storage driver (lib/db.ts): JSON files in
 * dev, Postgres in production. Namespaces: 'hubs', 'meta', 'portals'.
 */

import crypto from 'crypto'
import { cookies } from 'next/headers'
import seed from '@/brand.config'
import type { BrandConfig, SharePortal } from '@/app/types/brand'
import type { User } from './users'
import { getStorage, storageConfigured } from './db'
import { assetKey } from './uploads'
import { pinCookieName, pinCookieValue } from './auth'
import { deletePortalStats } from './analytics'

/** Slugs that can never be hub addresses — they collide with app routes. */
const RESERVED_SLUGS = new Set(['api', 'preview', 'hub', 'admin', 'login', 'signup', 'settings', 'dashboard', 'pricing', 'brand', 's', '_next'])

// ─── Hubs ─────────────────────────────────────────────────────────────────────

export async function getHub(slug: string): Promise<BrandConfig | null> {
  const hub = storageConfigured() ? await getStorage().getJSON<BrandConfig>('hubs', slug) : null
  if (hub) return hub
  // The seed hub exists even before its record is first written — and before
  // there's a database at all, so the demo works on a fresh deployment.
  return slug === seed.slug ? seed : null
}

export async function saveHub(config: BrandConfig): Promise<BrandConfig> {
  const next = { ...config, updatedAt: new Date().toISOString() }
  await getStorage().putJSON('hubs', config.slug, next)
  return next
}

/** Create a new hub, deriving a unique slug from the desired one. */
export async function createHub(
  config: BrandConfig,
  ownerId: string | null = null,
  extra: Partial<Pick<HubMeta, 'studio' | 'client'>> = {},
): Promise<BrandConfig> {
  const base = slugify(config.slug || config.name) || 'brand'
  let slug = base
  let n = 2
  while (RESERVED_SLUGS.has(slug) || slug === seed.slug || (await getStorage().getJSON('hubs', slug))) {
    slug = `${base}-${n++}`
  }
  const hub = await saveHub({ ...config, slug })
  await saveMeta({ slug, ownerId, editors: [], pin: null, createdAt: new Date().toISOString(), ...extra })
  return hub
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

// ─── Hub meta: ownership, editors, viewer PIN ────────────────────────────────

export interface HubMeta {
  slug: string
  /** null = unowned. The seed hub is a demo anyone may edit. */
  ownerId: string | null
  /** Editor emails — matched against the signed-in user's email. */
  editors: string[]
  /** Viewer PIN or password (4–64 chars), or null for public. */
  pin: string | null
  /** ISO date the share link stops working, or null for no expiry. */
  expiresAt?: string | null
  /** Client space this hub belongs to — the agency's label for the client. */
  client?: string
  /**
   * The owner's own brand — their studio, not a client's. One per account.
   * It doesn't count against the plan's client-space limit, and it supplies
   * the default branding for portals shared from the client hubs beside it.
   */
  studio?: boolean
  demo?: boolean
  createdAt: string
}

/** Has the share link passed its expiry date? */
export function isExpired(meta: HubMeta): boolean {
  return Boolean(meta.expiresAt && Date.now() > new Date(meta.expiresAt).getTime())
}

export async function getMeta(slug: string): Promise<HubMeta> {
  const meta = storageConfigured() ? await getStorage().getJSON<HubMeta>('meta', slug) : null
  if (meta) return meta
  // No meta: the seed demo hub, or a pre-accounts hub. Both stay open demos.
  return { slug, ownerId: null, editors: [], pin: null, demo: true, createdAt: new Date(0).toISOString() }
}

export async function saveMeta(meta: HubMeta): Promise<HubMeta> {
  await getStorage().putJSON('meta', meta.slug, meta)
  return meta
}

export function canEditHub(meta: HubMeta, user: User | null): boolean {
  if (meta.demo) return true
  if (!user) return false
  return meta.ownerId === user.id || meta.editors.includes(user.email)
}

export function isHubOwner(meta: HubMeta, user: User | null): boolean {
  return Boolean(user && meta.ownerId === user.id)
}

/**
 * May this request see what's inside the hub?
 *
 * The PIN gate on the page is only half the answer: anything that hands back
 * hub data or asset files has to ask the same question, or the gate protects
 * the rendering and nothing else. Editors are always allowed; a hub with no
 * PIN is open to anyone holding the link; otherwise the unlock cookie decides.
 */
export async function canViewHub(slug: string, meta: HubMeta, user: User | null): Promise<boolean> {
  if (canEditHub(meta, user)) return true
  if (!meta.pin) return true
  const store = await cookies()
  return store.get(pinCookieName(slug))?.value === (await pinCookieValue(slug, meta.pin))
}

/** Every hub the user owns or can edit, for the dashboard. */
export async function listHubsForUser(user: User): Promise<Array<{ hub: BrandConfig; meta: HubMeta; role: 'owner' | 'editor' }>> {
  const slugs = await getStorage().listKeys('hubs')
  const out: Array<{ hub: BrandConfig; meta: HubMeta; role: 'owner' | 'editor' }> = []
  for (const slug of slugs) {
    const meta = await getMeta(slug)
    const role = meta.ownerId === user.id ? 'owner' : meta.editors.includes(user.email) ? 'editor' : null
    if (!role) continue
    const hub = await getHub(slug)
    if (hub) out.push({ hub, meta, role })
  }
  return out.sort((a, b) => (b.hub.updatedAt || '').localeCompare(a.hub.updatedAt || ''))
}

/** Move a hub to a new slug. Returns the final slug or an error string. */
export async function renameHub(oldSlug: string, wanted: string): Promise<{ slug?: string; error?: string }> {
  const next = slugify(wanted)
  if (!next) return { error: 'That address isn’t valid — use letters and numbers' }
  if (next === oldSlug) return { slug: oldSlug }
  if (RESERVED_SLUGS.has(next) || next === seed.slug || (await getStorage().getJSON('hubs', next))) {
    return { error: 'That address is already taken' }
  }
  const hub = await getHub(oldSlug)
  if (!hub) return { error: 'Hub not found' }
  const meta = await getMeta(oldSlug)
  await saveHub({ ...hub, slug: next })
  await saveMeta({ ...meta, slug: next })
  await getStorage().deleteJSON('hubs', oldSlug)
  await getStorage().deleteJSON('meta', oldSlug)
  return { slug: next }
}

export async function deleteHub(slug: string): Promise<void> {
  // Take the files first. Dropping only the record would leave every asset
  // sitting in storage, still reachable by name through /api/files — deleting
  // a client's hub has to mean their work is actually gone.
  const hub = await getHub(slug)
  if (hub) {
    for (const name of assetKeysOf(hub)) {
      await getStorage().deleteFile(name).catch(() => {})
    }
  }
  await getStorage().deleteJSON('hubs', slug)
  await getStorage().deleteJSON('meta', slug)
  for (const portal of await listPortals(slug)) await deletePortal(portal.id)
}

/** Every stored file a hub refers to, as storage keys. */
export function assetKeysOf(hub: BrandConfig): string[] {
  const names = new Set<string>()
  for (const files of Object.values(hub.assets || {})) {
    for (const asset of files || []) {
      const key = assetKey(asset.file)
      if (key) names.add(basename(key))
    }
  }
  // The logo is referenced on its own, not through a section.
  const logo = hub.logoUrl ? assetKey(hub.logoUrl) : null
  if (logo) names.add(basename(logo))
  return [...names]
}

/** Storage keys are flat names; never let a path climb out of the bucket. */
function basename(key: string): string {
  return key.split('/').pop() || key
}

/** How many hubs a user owns (for plan limits). Demo hubs don't count. */
/**
 * Client spaces the user owns — what plan limits are counted in.
 *
 * Their own studio hub is deliberately excluded: it holds the agency's brand,
 * not a client's, and charging someone a slot for it would mean the free tier
 * couldn't hold one client.
 */
export async function countOwnedHubs(userId: string): Promise<number> {
  const slugs = await getStorage().listKeys('hubs')
  let count = 0
  for (const slug of slugs) {
    const meta = await getMeta(slug)
    if (!meta.demo && !meta.studio && meta.ownerId === userId) count++
  }
  return count
}

/** The user's own studio hub, if they've set one up. */
export async function getStudioHub(userId: string): Promise<{ hub: BrandConfig; meta: HubMeta } | null> {
  const slugs = await getStorage().listKeys('hubs')
  for (const slug of slugs) {
    const meta = await getMeta(slug)
    if (!meta.studio || meta.ownerId !== userId) continue
    const hub = await getHub(slug)
    if (hub) return { hub, meta }
  }
  return null
}

/**
 * Hand a hub to a new owner; the old owner stays on as an editor.
 *
 * The studio flag does not travel with it. It means "this is my own brand",
 * which stops being true the moment the hub belongs to somebody else — and if
 * it did travel, a recipient who already has a studio hub would end up with
 * two, leaving `getStudioHub` to pick between them arbitrarily.
 */
export async function transferOwnership(slug: string, newOwnerId: string, newOwnerEmail: string, oldOwnerEmail?: string): Promise<void> {
  const meta = await getMeta(slug)
  const editors = meta.editors.filter(e => e !== newOwnerEmail)
  if (oldOwnerEmail && !editors.includes(oldOwnerEmail)) editors.push(oldOwnerEmail)
  await saveMeta({ ...meta, ownerId: newOwnerId, editors, studio: false })
}

/** Keep editor lists in sync when an account's email changes. */
export async function renameEditorEmail(oldEmail: string, newEmail: string): Promise<void> {
  await forEachMeta(async meta => {
    if (!meta.editors.includes(oldEmail)) return null
    return { ...meta, editors: meta.editors.map(e => (e === oldEmail ? newEmail : e)) }
  })
}

/** Remove an email from every editor list (account deletion, leaving hubs). */
export async function removeEditorEverywhere(email: string): Promise<void> {
  await forEachMeta(async meta => {
    if (!meta.editors.includes(email)) return null
    return { ...meta, editors: meta.editors.filter(e => e !== email) }
  })
}

/** Delete every hub a user owns (account deletion). Returns deleted slugs. */
export async function deleteHubsOwnedBy(userId: string): Promise<string[]> {
  const slugs = await getStorage().listKeys('hubs')
  const deleted: string[] = []
  for (const slug of slugs) {
    const meta = await getMeta(slug)
    if (!meta.demo && meta.ownerId === userId) {
      await deleteHub(slug)
      deleted.push(slug)
    }
  }
  return deleted
}

async function forEachMeta(update: (meta: HubMeta) => Promise<HubMeta | null>): Promise<void> {
  const slugs = await getStorage().listKeys('meta')
  for (const slug of slugs) {
    const meta = await getMeta(slug)
    const next = await update(meta)
    if (next) await saveMeta(next)
  }
}

// ─── Share portals ────────────────────────────────────────────────────────────
// A portal is one shared view of a hub: a template, a section selection, and
// optional white-label branding. Each lives at /s/<id> so an agency can hand
// out several links — a client handoff, a press kit — from the same hub.

export type NewPortal = Omit<SharePortal, 'id' | 'createdAt'>

export async function createPortal(input: NewPortal): Promise<SharePortal> {
  const portal: SharePortal = {
    ...input,
    id: crypto.randomBytes(6).toString('base64url'),
    createdAt: new Date().toISOString(),
  }
  await getStorage().putJSON('portals', portal.id, portal)
  return portal
}

export async function getPortal(id: string): Promise<SharePortal | null> {
  return getStorage().getJSON<SharePortal>('portals', id)
}

export async function savePortal(portal: SharePortal): Promise<SharePortal> {
  await getStorage().putJSON('portals', portal.id, portal)
  return portal
}

export async function deletePortal(id: string): Promise<void> {
  await getStorage().deleteJSON('portals', id)
  await deletePortalStats(id)
}

/** Every portal shared from one hub, newest first. */
export async function listPortals(slug: string): Promise<SharePortal[]> {
  const ids = await getStorage().listKeys('portals')
  const out: SharePortal[] = []
  for (const id of ids) {
    const portal = await getPortal(id)
    if (portal?.slug === slug) out.push(portal)
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function isPortalExpired(portal: SharePortal): boolean {
  return Boolean(portal.expiresAt && Date.now() > new Date(portal.expiresAt).getTime())
}
