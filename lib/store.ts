/**
 * Hub store — server-side persistence for the hub's brand config.
 *
 * v1 keeps a single hub in a JSON file under /data. The interface (getHub /
 * saveHub) is the seam where a database (one row per hub) slots in later
 * without touching any UI code.
 */

import { promises as fs } from 'fs'
import path from 'path'
import seed from '@/brand.config'
import type { BrandConfig } from '@/app/types/brand'

const DATA_DIR = path.join(process.cwd(), 'data')
const HUB_FILE = path.join(DATA_DIR, 'hub.json')

export async function getHub(): Promise<BrandConfig> {
  try {
    const raw = await fs.readFile(HUB_FILE, 'utf8')
    return JSON.parse(raw) as BrandConfig
  } catch {
    // First run (or unreadable file): fall back to the seed config.
    return seed
  }
}

export async function saveHub(config: BrandConfig): Promise<BrandConfig> {
  const next = { ...config, updatedAt: new Date().toISOString() }
  await fs.mkdir(DATA_DIR, { recursive: true })
  // Write-then-rename so a crash mid-write can't corrupt the stored hub.
  const tmp = `${HUB_FILE}.tmp`
  await fs.writeFile(tmp, JSON.stringify(next, null, 2), 'utf8')
  await fs.rename(tmp, HUB_FILE)
  return next
}
