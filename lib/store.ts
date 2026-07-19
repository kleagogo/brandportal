/**
 * Hub store — server-side persistence for brand hubs.
 *
 * Layout on disk:
 *   data/hubs/<slug>.json      — claimed hubs, one file per hub
 *   data/previews/<id>.json    — unclaimed scan previews (expire after 24h)
 *
 * The interface below is the seam where a database (one row per hub) slots in
 * later without touching any UI code.
 */

import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import seed from '@/brand.config'
import type { BrandConfig } from '@/app/types/brand'
import type { User } from './users'

const DATA_DIR = path.join(process.cwd(), 'data')
const HUBS_DIR = path.join(DATA_DIR, 'hubs')
const META_DIR = path.join(DATA_DIR, 'meta')
const PREVIEWS_DIR = path.join(DATA_DIR, 'previews')

export const PREVIEW_TTL_MS = 24 * 60 * 60 * 1000

/** Slugs that can never be hub addresses — they collide with app routes. */
const RESERVED_SLUGS = new Set(['api', 'preview', 'hub', 'admin', 'login', 'signup', 'settings', 'pricing', 'brand', '_next'])

// ─── Hubs ─────────────────────────────────────────────────────────────────────

export async function getHub(slug: string): Promise<BrandConfig | null> {
  try {
    const raw = await fs.readFile(hubFile(slug), 'utf8')
    return JSON.parse(raw) as BrandConfig
  } catch {
    // The seed hub exists even before its file is first written.
    if (slug === seed.slug) return seed
    return null
  }
}

export async function saveHub(config: BrandConfig): Promise<BrandConfig> {
  const next = { ...config, updatedAt: new Date().toISOString() }
  await fs.mkdir(HUBS_DIR, { recursive: true })
  await atomicWrite(hubFile(config.slug), JSON.stringify(next, null, 2))
  return next
}

/** Create a new hub, deriving a unique slug from the desired one. */
export async function createHub(config: BrandConfig, ownerId: string | null = null): Promise<BrandConfig> {
  await fs.mkdir(HUBS_DIR, { recursive: true })
  const base = slugify(config.slug || config.name) || 'brand'
  let slug = base
  let n = 2
  while (RESERVED_SLUGS.has(slug) || slug === seed.slug || (await exists(hubFile(slug)))) {
    slug = `${base}-${n++}`
  }
  const hub = await saveHub({ ...config, slug })
  await saveMeta({ slug, ownerId, editors: [], pin: null, createdAt: new Date().toISOString() })
  return hub
}

// ─── Hub meta: ownership, editors, viewer PIN ────────────────────────────────

export interface HubMeta {
  slug: string
  /** null = unowned. The seed hub is a demo anyone may edit. */
  ownerId: string | null
  /** Editor emails — matched against the signed-in user's email. */
  editors: string[]
  /** 4–8 digit viewer PIN, or null for public. */
  pin: string | null
  demo?: boolean
  createdAt: string
}

export async function getMeta(slug: string): Promise<HubMeta> {
  try {
    return JSON.parse(await fs.readFile(metaFile(slug), 'utf8')) as HubMeta
  } catch {
    // No meta: the seed demo hub, or a pre-accounts hub. Both stay open demos.
    return { slug, ownerId: null, editors: [], pin: null, demo: true, createdAt: new Date(0).toISOString() }
  }
}

export async function saveMeta(meta: HubMeta): Promise<HubMeta> {
  await fs.mkdir(META_DIR, { recursive: true })
  await atomicWrite(metaFile(meta.slug), JSON.stringify(meta, null, 2))
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

/** Every hub the user owns or can edit, for the dashboard. */
export async function listHubsForUser(user: User): Promise<Array<{ hub: BrandConfig; meta: HubMeta; role: 'owner' | 'editor' }>> {
  let names: string[] = []
  try { names = await fs.readdir(HUBS_DIR) } catch { /* no hubs yet */ }
  const out: Array<{ hub: BrandConfig; meta: HubMeta; role: 'owner' | 'editor' }> = []
  for (const name of names) {
    if (!name.endsWith('.json')) continue
    const slug = name.slice(0, -5)
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
  if (RESERVED_SLUGS.has(next) || next === seed.slug || (await exists(hubFile(next)))) {
    return { error: 'That address is already taken' }
  }
  const hub = await getHub(oldSlug)
  if (!hub) return { error: 'Hub not found' }
  const meta = await getMeta(oldSlug)
  await saveHub({ ...hub, slug: next })
  await saveMeta({ ...meta, slug: next })
  await fs.unlink(hubFile(oldSlug)).catch(() => {})
  await fs.unlink(metaFile(oldSlug)).catch(() => {})
  return { slug: next }
}

export async function deleteHub(slug: string): Promise<void> {
  await fs.unlink(hubFile(slug)).catch(() => {})
  await fs.unlink(metaFile(slug)).catch(() => {})
}

/** How many hubs a user owns (for plan limits). Demo hubs don't count. */
export async function countOwnedHubs(userId: string): Promise<number> {
  let names: string[] = []
  try { names = await fs.readdir(HUBS_DIR) } catch { return 0 }
  let count = 0
  for (const name of names) {
    if (!name.endsWith('.json')) continue
    const meta = await getMeta(name.slice(0, -5))
    if (!meta.demo && meta.ownerId === userId) count++
  }
  return count
}

/** Hand a hub to a new owner; the old owner stays on as an editor. */
export async function transferOwnership(slug: string, newOwnerId: string, newOwnerEmail: string, oldOwnerEmail?: string): Promise<void> {
  const meta = await getMeta(slug)
  const editors = meta.editors.filter(e => e !== newOwnerEmail)
  if (oldOwnerEmail && !editors.includes(oldOwnerEmail)) editors.push(oldOwnerEmail)
  await saveMeta({ ...meta, ownerId: newOwnerId, editors })
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
  let names: string[] = []
  try { names = await fs.readdir(HUBS_DIR) } catch { return [] }
  const deleted: string[] = []
  for (const name of names) {
    if (!name.endsWith('.json')) continue
    const slug = name.slice(0, -5)
    const meta = await getMeta(slug)
    if (!meta.demo && meta.ownerId === userId) {
      await deleteHub(slug)
      deleted.push(slug)
    }
  }
  return deleted
}

async function forEachMeta(update: (meta: HubMeta) => Promise<HubMeta | null>): Promise<void> {
  let names: string[] = []
  try { names = await fs.readdir(META_DIR) } catch { return }
  for (const name of names) {
    if (!name.endsWith('.json')) continue
    const meta = await getMeta(name.slice(0, -5))
    const next = await update(meta)
    if (next) await saveMeta(next)
  }
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

// ─── Previews ─────────────────────────────────────────────────────────────────

export async function savePreview(config: BrandConfig): Promise<string> {
  await fs.mkdir(PREVIEWS_DIR, { recursive: true })
  const id = crypto.randomBytes(6).toString('base64url')
  const record = { config, createdAt: Date.now() }
  await atomicWrite(previewFile(id), JSON.stringify(record))
  void cleanupPreviews()
  return id
}

export async function getPreview(id: string): Promise<BrandConfig | null> {
  try {
    const safe = path.basename(id)
    const raw = await fs.readFile(previewFile(safe), 'utf8')
    const record = JSON.parse(raw) as { config: BrandConfig; createdAt: number }
    if (Date.now() - record.createdAt > PREVIEW_TTL_MS) return null
    return record.config
  } catch {
    return null
  }
}

export async function deletePreview(id: string): Promise<void> {
  try { await fs.unlink(previewFile(path.basename(id))) } catch { /* already gone */ }
}

/** Best-effort removal of expired previews; never blocks a request. */
async function cleanupPreviews(): Promise<void> {
  try {
    const names = await fs.readdir(PREVIEWS_DIR)
    for (const name of names) {
      try {
        const raw = await fs.readFile(path.join(PREVIEWS_DIR, name), 'utf8')
        const record = JSON.parse(raw) as { createdAt: number }
        if (Date.now() - record.createdAt > PREVIEW_TTL_MS) {
          await fs.unlink(path.join(PREVIEWS_DIR, name))
        }
      } catch { /* skip unreadable entries */ }
    }
  } catch { /* previews dir may not exist yet */ }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hubFile(slug: string): string {
  return path.join(HUBS_DIR, `${path.basename(slug)}.json`)
}

function metaFile(slug: string): string {
  return path.join(META_DIR, `${path.basename(slug)}.json`)
}

function previewFile(id: string): string {
  return path.join(PREVIEWS_DIR, `${id}.json`)
}

async function exists(file: string): Promise<boolean> {
  try { await fs.access(file); return true } catch { return false }
}

async function atomicWrite(file: string, content: string): Promise<void> {
  const tmp = `${file}.tmp`
  await fs.writeFile(tmp, content, 'utf8')
  await fs.rename(tmp, file)
}
