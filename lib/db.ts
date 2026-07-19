/**
 * Storage driver — the single seam between the app and where data lives.
 *
 * Two drivers, chosen automatically:
 *  - FileStorage (default): JSON files under /data. Great for local dev.
 *  - PgStorage: used when DATABASE_URL is set (e.g. Vercel + Neon). Keeps
 *    everything — hubs, users, tokens, uploaded files — in Postgres, so the
 *    app works on serverless hosts with no filesystem persistence.
 *
 * The interface is deliberately tiny (namespaced JSON docs + named blobs);
 * every store module goes through it and nothing else touches disk.
 */

import { promises as fs } from 'fs'
import path from 'path'
import { Pool } from 'pg'

export interface Storage {
  getJSON<T>(ns: string, key: string): Promise<T | null>
  putJSON(ns: string, key: string, value: unknown): Promise<void>
  deleteJSON(ns: string, key: string): Promise<void>
  listKeys(ns: string): Promise<string[]>
  getFile(name: string): Promise<Buffer | null>
  putFile(name: string, data: Buffer): Promise<void>
}

// ─── File driver ──────────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), 'data')

class FileStorage implements Storage {
  private jsonPath(ns: string, key: string): string {
    return path.join(DATA_DIR, path.basename(ns), `${path.basename(key)}.json`)
  }

  async getJSON<T>(ns: string, key: string): Promise<T | null> {
    try {
      return JSON.parse(await fs.readFile(this.jsonPath(ns, key), 'utf8')) as T
    } catch {
      return this.legacy<T>(ns, key)
    }
  }

  /** Pre-driver layouts (data/users.json, data/tokens.json) keep working. */
  private async legacy<T>(ns: string, key: string): Promise<T | null> {
    if (ns !== 'app') return null
    if (key !== 'users' && key !== 'tokens') return null
    try {
      return JSON.parse(await fs.readFile(path.join(DATA_DIR, `${key}.json`), 'utf8')) as T
    } catch {
      return null
    }
  }

  async putJSON(ns: string, key: string, value: unknown): Promise<void> {
    const file = this.jsonPath(ns, key)
    await fs.mkdir(path.dirname(file), { recursive: true })
    const tmp = `${file}.tmp`
    await fs.writeFile(tmp, JSON.stringify(value, null, 2), 'utf8')
    await fs.rename(tmp, file)
  }

  async deleteJSON(ns: string, key: string): Promise<void> {
    await fs.unlink(this.jsonPath(ns, key)).catch(() => {})
  }

  async listKeys(ns: string): Promise<string[]> {
    try {
      const names = await fs.readdir(path.join(DATA_DIR, path.basename(ns)))
      return names.filter(n => n.endsWith('.json') && !n.endsWith('.tmp')).map(n => n.slice(0, -5))
    } catch {
      return []
    }
  }

  private filePath(name: string): string {
    return path.join(DATA_DIR, 'uploads', path.basename(name))
  }

  async getFile(name: string): Promise<Buffer | null> {
    try {
      return await fs.readFile(this.filePath(name))
    } catch {
      return null
    }
  }

  async putFile(name: string, data: Buffer): Promise<void> {
    await fs.mkdir(path.join(DATA_DIR, 'uploads'), { recursive: true })
    await fs.writeFile(this.filePath(name), data)
  }
}

// ─── Postgres driver ──────────────────────────────────────────────────────────

type QueryFn = (text: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>

export class PgStorage implements Storage {
  private ready: Promise<void> | null = null

  constructor(private query: QueryFn) {}

  private init(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        await this.query(`CREATE TABLE IF NOT EXISTS kv (
          ns text NOT NULL,
          key text NOT NULL,
          value jsonb NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (ns, key)
        )`)
        await this.query(`CREATE TABLE IF NOT EXISTS blobs (
          name text PRIMARY KEY,
          data bytea NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        )`)
      })()
    }
    return this.ready
  }

  async getJSON<T>(ns: string, key: string): Promise<T | null> {
    await this.init()
    const r = await this.query('SELECT value FROM kv WHERE ns = $1 AND key = $2', [ns, key])
    return (r.rows[0]?.value as T) ?? null
  }

  async putJSON(ns: string, key: string, value: unknown): Promise<void> {
    await this.init()
    await this.query(
      `INSERT INTO kv (ns, key, value) VALUES ($1, $2, $3)
       ON CONFLICT (ns, key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [ns, key, JSON.stringify(value)]
    )
  }

  async deleteJSON(ns: string, key: string): Promise<void> {
    await this.init()
    await this.query('DELETE FROM kv WHERE ns = $1 AND key = $2', [ns, key])
  }

  async listKeys(ns: string): Promise<string[]> {
    await this.init()
    const r = await this.query('SELECT key FROM kv WHERE ns = $1', [ns])
    return r.rows.map(row => String(row.key))
  }

  async getFile(name: string): Promise<Buffer | null> {
    await this.init()
    const r = await this.query('SELECT data FROM blobs WHERE name = $1', [name])
    const data = r.rows[0]?.data
    return data ? Buffer.from(data as Uint8Array) : null
  }

  async putFile(name: string, data: Buffer): Promise<void> {
    await this.init()
    await this.query(
      `INSERT INTO blobs (name, data) VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [name, data]
    )
  }
}

// ─── Driver selection ─────────────────────────────────────────────────────────

let singleton: Storage | null = null

export function getStorage(): Storage {
  if (!singleton) {
    if (process.env.DATABASE_URL) {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
      singleton = new PgStorage((text, params) => pool.query(text, params as never[]))
    } else {
      singleton = new FileStorage()
    }
  }
  return singleton
}
