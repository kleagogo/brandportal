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
import { r2Enabled, r2Get, r2Put } from './r2'
import { MIME, extensionOf } from './uploads'

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

// ─── R2 files, records elsewhere ──────────────────────────────────────────────

/**
 * Keeps records where they were (Postgres or disk) and moves the files to R2.
 *
 * Reads fall back to the record store, so files uploaded before R2 existed
 * keep working — nothing has to be migrated for the switch to be safe.
 */
class R2Files implements Storage {
  constructor(private records: Storage) {}

  getJSON<T>(ns: string, key: string) { return this.records.getJSON<T>(ns, key) }
  putJSON(ns: string, key: string, value: unknown) { return this.records.putJSON(ns, key, value) }
  deleteJSON(ns: string, key: string) { return this.records.deleteJSON(ns, key) }
  listKeys(ns: string) { return this.records.listKeys(ns) }

  async getFile(name: string): Promise<Buffer | null> {
    return (await r2Get(name)) ?? this.records.getFile(name)
  }

  async putFile(name: string, data: Buffer): Promise<void> {
    await r2Put(name, data, MIME[extensionOf(name)])
  }
}

// ─── Driver selection ─────────────────────────────────────────────────────────

let singleton: Storage | null = null

export function getStorage(): Storage {
  if (!singleton) {
    const url = process.env.DATABASE_URL
    let store: Storage
    if (url) {
      store = new PgStorage(onWorkers() ? httpQuery(url) : poolQuery(url))
    } else if (onWorkers()) {
      // There's no filesystem here, so say so plainly rather than failing
      // later inside a write with an unrecognisable error.
      throw new Error('DATABASE_URL must be set — Cloudflare Workers have no filesystem to fall back to')
    } else {
      store = new FileStorage()
    }
    singleton = r2Enabled() ? new R2Files(store) : store
  }
  return singleton
}

/** Cloudflare Workers — no long-lived TCP connections to hold a pool open. */
function onWorkers(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers'
}

/**
 * Node hosts: a normal pooled TCP connection.
 *
 * `pg` is loaded through an indirect import so bundlers building the Worker
 * never follow it — that path can't run there, and its native socket shim
 * breaks the build if it's pulled in.
 */
function poolQuery(connectionString: string): QueryFn {
  let pool: { query: (text: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }> } | null = null
  return async (text, params) => {
    if (!pool) {
      const load = new Function('m', 'return import(m)') as (m: string) => Promise<typeof import('pg')>
      const { Pool } = await load('pg')
      pool = new Pool({ connectionString, max: 5 }) as unknown as typeof pool
    }
    return pool!.query(text, params as never[])
  }
}

/**
 * Neon over HTTP: one request per query, which is exactly what a Worker wants.
 * Every query in this app is a single statement, so nothing is lost.
 */
function httpQuery(connectionString: string): QueryFn {
  let sql: ReturnType<typeof import('@neondatabase/serverless').neon> | null = null
  return async (text, params) => {
    if (!sql) {
      const { neon } = await import('@neondatabase/serverless')
      sql = neon(connectionString)
    }
    const result: unknown = await sql.query(text, params as never[])
    // The driver returns rows directly, or a full result depending on config.
    const rows = Array.isArray(result) ? result : (result as { rows?: unknown[] }).rows || []
    return { rows: rows as Array<Record<string, unknown>> }
  }
}
