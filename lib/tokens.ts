/**
 * Single-use tokens for magic links: sign-in, claiming, invites, transfers,
 * email changes. Stored as one JSON list ('app'/'tokens') via the driver;
 * consumed (deleted) on first use. Login-ish tokens expire in 1h, invites
 * and transfers in 7 days so a link sent to a client keeps working.
 */

import crypto from 'crypto'
import { getStorage } from './db'

export type TokenPurpose = 'login' | 'claim' | 'invite' | 'transfer' | 'email-change'

export interface TokenRecord {
  token: string
  purpose: TokenPurpose
  /** Email the link was issued to. */
  email: string
  /** For 'claim': the preview being claimed. */
  previewId?: string
  /** For 'invite' / 'transfer': the hub involved. */
  slug?: string
  /** For 'email-change': the account being changed. */
  userId?: string
  /** Where to send the user after verification. */
  redirect?: string
  expiresAt: number
}

async function readTokens(): Promise<TokenRecord[]> {
  return (await getStorage().getJSON<TokenRecord[]>('app', 'tokens')) || []
}

async function writeTokens(tokens: TokenRecord[]): Promise<void> {
  await getStorage().putJSON('app', 'tokens', tokens)
}

export async function createToken(record: Omit<TokenRecord, 'token' | 'expiresAt'>): Promise<string> {
  const tokens = (await readTokens()).filter(t => t.expiresAt > Date.now())
  const token = crypto.randomBytes(24).toString('base64url')
  const ttl = record.purpose === 'invite' || record.purpose === 'transfer' ? 7 * 24 * 3600_000 : 3600_000
  tokens.push({ ...record, token, expiresAt: Date.now() + ttl })
  await writeTokens(tokens)
  return token
}

/** Validate and consume a token — each link works exactly once. */
export async function consumeToken(token: string): Promise<TokenRecord | null> {
  const tokens = await readTokens()
  const found = tokens.find(t => t.token === token && t.expiresAt > Date.now())
  if (!found) return null
  await writeTokens(tokens.filter(t => t.token !== token))
  return found
}

/** Outstanding invites/transfers for a hub (so owners can see and revoke them). */
export async function listTokensForSlug(slug: string): Promise<TokenRecord[]> {
  const tokens = await readTokens()
  return tokens.filter(t => t.slug === slug && t.expiresAt > Date.now() && (t.purpose === 'invite' || t.purpose === 'transfer'))
}

export async function revokeToken(token: string): Promise<void> {
  const tokens = await readTokens()
  await writeTokens(tokens.filter(t => t.token !== token))
}
