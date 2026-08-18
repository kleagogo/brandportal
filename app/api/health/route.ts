import { NextResponse } from 'next/server'
import { getStorage } from '@/lib/db'
import { r2Enabled } from '@/lib/r2'
import { blobEnabled } from '@/lib/uploads'

/**
 * Is this deployment actually wired up?
 *
 * Hit it right after a deploy: it writes and reads a row, and reports which
 * services are configured. Booleans only — no keys, hosts, or connection
 * strings are ever returned.
 */
export async function GET() {
  const checks = {
    storage: false,
    storageError: null as string | null,
    database: Boolean(process.env.DATABASE_URL),
    files: r2Enabled() ? 'r2' : blobEnabled() ? 'blob' : 'database',
    email: Boolean(process.env.RESEND_API_KEY),
    // The key alone doesn't mean mail works: without a verified sender the
    // provider rejects every send to anyone but the account owner. Reported
    // separately so a wiped EMAIL_FROM is visible here instead of only in
    // a 502 from /api/auth/request.
    emailFrom: Boolean(process.env.EMAIL_FROM),
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
