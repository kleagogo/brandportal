/**
 * Sessions and signing — cookie-based auth with no passwords.
 *
 * A session cookie is a signed payload (userId + expiry), verified with an
 * HMAC secret that lives in AUTH_SECRET or is generated once into /data.
 */

import crypto from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { cookies } from 'next/headers'
import { getUserById, type User } from './users'
import { getStorage } from './db'

const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000

export const SESSION_COOKIE = 'bp_session'

let cachedSecret: string | null = null

async function getSecret(): Promise<string> {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET
  if (cachedSecret) return cachedSecret
  const stored = await getStorage().getJSON<{ secret: string }>('app', 'auth-secret')
  if (stored?.secret) {
    cachedSecret = stored.secret
    return cachedSecret
  }
  // Legacy location (pre-driver): a raw text file.
  try {
    cachedSecret = (await fs.readFile(path.join(process.cwd(), 'data', 'auth-secret'), 'utf8')).trim()
  } catch {
    cachedSecret = crypto.randomBytes(32).toString('hex')
  }
  await getStorage().putJSON('app', 'auth-secret', { secret: cachedSecret })
  return cachedSecret
}

async function hmac(data: string): Promise<string> {
  return crypto.createHmac('sha256', await getSecret()).update(data).digest('base64url')
}

export async function createSessionValue(userId: string): Promise<string> {
  const payload = Buffer.from(JSON.stringify({ u: userId, e: Date.now() + SESSION_TTL_MS })).toString('base64url')
  return `${payload}.${await hmac(payload)}`
}

export async function verifySessionValue(value: string | undefined): Promise<string | null> {
  if (!value) return null
  const [payload, sig] = value.split('.')
  if (!payload || !sig) return null
  const expected = await hmac(payload)
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try {
    const { u, e } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (typeof u !== 'string' || Date.now() > e) return null
    return u
  } catch {
    return null
  }
}

/** The signed-in user for the current request, or null. */
export async function getSessionUser(): Promise<User | null> {
  const store = await cookies()
  const userId = await verifySessionValue(store.get(SESSION_COOKIE)?.value)
  return userId ? getUserById(userId) : null
}

// ─── Viewer PIN cookies ───────────────────────────────────────────────────────
// The cookie stores an HMAC of slug+pin, so the pin itself never leaves the
// server, and changing the pin invalidates every existing cookie.

export function pinCookieName(slug: string): string {
  return `bp_pin_${slug.replace(/[^a-z0-9-]/g, '')}`
}

export async function pinCookieValue(slug: string, pin: string): Promise<string> {
  return hmac(`pin:${slug}:${pin}`)
}
