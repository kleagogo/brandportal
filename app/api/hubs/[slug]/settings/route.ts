import { NextRequest, NextResponse } from 'next/server'
import { deleteHub, getHub, getMeta, isHubOwner, renameHub, saveMeta } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'
import { createToken, listTokensForSlug, revokeToken } from '@/lib/tokens'
import { sendMagicLink } from '@/lib/email'
import { isValidEmail, normalizeEmail } from '@/lib/users'

/** Owner-only hub settings: PIN, editors, address, deletion. */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const meta = await getMeta(slug)
  const user = await getSessionUser()
  if (!isHubOwner(meta, user)) {
    return NextResponse.json({ error: 'Only the owner can see hub settings' }, { status: 403 })
  }
  const pending = await listTokensForSlug(slug)
  return NextResponse.json({
    pin: meta.pin,
    editors: meta.editors,
    slug: meta.slug,
    pendingInvites: pending.map(t => ({ token: t.token, email: t.email, purpose: t.purpose })),
  })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const meta = await getMeta(slug)
  const user = await getSessionUser()
  if (!isHubOwner(meta, user)) {
    return NextResponse.json({ error: 'Only the owner can change hub settings' }, { status: 403 })
  }

  let body: { pin?: string | null; removeEditor?: string; newSlug?: string; revokeInvite?: string; transferTo?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  let current = meta

  if (body.revokeInvite) {
    await revokeToken(body.revokeInvite)
  }

  // Initiate an ownership transfer: the new owner accepts via magic link.
  if (body.transferTo !== undefined) {
    const email = normalizeEmail(body.transferTo || '')
    if (!isValidEmail(email)) return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
    if (email === user!.email) return NextResponse.json({ error: 'You already own this hub' }, { status: 400 })
    const hub = await getHub(slug)
    const token = await createToken({ purpose: 'transfer', email, slug })
    const url = `${req.nextUrl.origin}/api/auth/verify?token=${token}`
    const result = await sendMagicLink({ to: email, url, kind: 'invite', hubName: hub?.name })
    return NextResponse.json({ ...result, transfer: email })
  }

  if (body.pin !== undefined) {
    if (body.pin !== null && !/^\d{4,8}$/.test(String(body.pin))) {
      return NextResponse.json({ error: 'PIN must be 4–8 digits' }, { status: 400 })
    }
    current = await saveMeta({ ...current, pin: body.pin === null ? null : String(body.pin) })
  }

  if (body.removeEditor) {
    current = await saveMeta({ ...current, editors: current.editors.filter(e => e !== body.removeEditor) })
  }

  if (body.newSlug) {
    const result = await renameHub(slug, body.newSlug)
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ ok: true, slug: result.slug, pin: current.pin, editors: current.editors })
  }

  return NextResponse.json({ ok: true, slug, pin: current.pin, editors: current.editors })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const meta = await getMeta(slug)
  const user = await getSessionUser()
  if (!isHubOwner(meta, user)) {
    return NextResponse.json({ error: 'Only the owner can delete a hub' }, { status: 403 })
  }
  await deleteHub(slug)
  return NextResponse.json({ ok: true })
}
