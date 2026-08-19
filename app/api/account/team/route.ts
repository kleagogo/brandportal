import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { isValidEmail, normalizeEmail } from '@/lib/users'
import { limitsFor } from '@/lib/limits'
import { addMember, listMembers, removeMember } from '@/lib/team'

/**
 * The account's team. Membership reaches every hub the account owns, so this
 * is owner-only and takes no hub in its path.
 */
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  return NextResponse.json({ members: await listMembers(user.id) })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })

  const { email: raw } = await req.json().catch(() => ({ email: '' }))
  const email = normalizeEmail(String(raw || ''))
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'That doesn’t look like an email address' }, { status: 400 })
  }
  if (email === normalizeEmail(user.email)) {
    return NextResponse.json({ error: 'You’re already on your own account' }, { status: 400 })
  }

  // The seat limit is per hub in the plan, and a member sits on every hub —
  // so the account's team is bounded by the same number.
  const members = await listMembers(user.id)
  const limit = limitsFor(user).editorsPerHub
  if (!members.includes(email) && members.length >= limit) {
    return NextResponse.json({
      error: `Your plan allows ${limit} teammates. Studio raises the limit.`,
    }, { status: 403 })
  }

  return NextResponse.json({ members: await addMember(user.id, email) })
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })

  const { email: raw } = await req.json().catch(() => ({ email: '' }))
  const email = normalizeEmail(String(raw || ''))
  if (!email) return NextResponse.json({ error: 'No teammate given' }, { status: 400 })

  return NextResponse.json({ members: await removeMember(user.id, email) })
}
