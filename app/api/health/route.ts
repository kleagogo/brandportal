import { NextResponse } from 'next/server'
import { getStorage } from '@/lib/db'
import { emailReadiness } from '@/lib/email'
import { r2Enabled } from '@/lib/r2'
import { blobEnabled } from '@/lib/uploads'

/**
 * Is this deployment actually wired up?
 *
 * Hit it right after a deploy: it writes and reads a row, and reports which
 * services are configured. Email carries a short diagnosis too, since "a key
 * is set" and "mail reaches your users" are different things. No keys, hosts,
 * connection strings, or domain listings are ever returned.
 */
export async function GET() {
  const checks = {
    storage: false,
    storageError: null as string | null,
    database: Boolean(process.env.DATABASE_URL),
    files: r2Enabled() ? 'r2' : blobEnabled() ? 'blob' : 'database',
    // Not `Boolean(RESEND_API_KEY)`: that reads true while every send is being
    // refused, which is exactly the state where the owner signs in and nobody
    // else can. Ask the provider whether a stranger can actually be reached.
    email: await emailReadiness(),
    ai: Boolean(process.env.ANTHROPIC_API_KEY),
    sessionSecret: Boolean(process.env.AUTH_SECRET),
  }

  try {
    const storage = getStorage()
    const stamp = new Date().toISOString()
    await storage.putJSON('app', 'health', { stamp })
    const read = await storage.getJSON<{ stamp: string }>('app', 'health')
    checks.storage = read?.stamp === stamp
  } catch (err) {
    checks.storageError = err instanceof Error ? err.message : 'unknown error'
  }

  return NextResponse.json(checks, { status: checks.storage ? 200 : 503 })
}
