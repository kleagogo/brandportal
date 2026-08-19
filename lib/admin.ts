import type { User } from './users'
import { normalizeEmail } from './users'

/**
 * Who runs this thing. ADMIN_EMAILS is a comma-separated list in
 * wrangler.jsonc — emails aren't secrets, and keeping it in the repo means a
 * deploy can't wipe it the way it wiped EMAIL_FROM once.
 *
 * The product has no role system; this is deliberately not one. It gates
 * exactly the controls the founder needs that customers must never see.
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => normalizeEmail(e))
    .filter(Boolean)
  return list.includes(normalizeEmail(user.email))
}
