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

const DATA_DIR = path.join(process.cwd(), 'data')
const HUBS_DIR = path.join(DATA_DIR, 'hubs')
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
export async function createHub(config: BrandConfig): Promise<BrandConfig> {
  await fs.mkdir(HUBS_DIR, { recursive: true })
  const base = slugify(config.slug || config.name) || 'brand'
  let slug = base
  let n = 2
  while (RESERVED_SLUGS.has(slug) || slug === seed.slug || (await exists(hubFile(slug)))) {
    slug = `${base}-${n++}`
  }
  return saveHub({ ...config, slug })
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
