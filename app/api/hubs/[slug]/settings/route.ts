import { NextRequest, NextResponse } from 'next/server'
import { deleteHub, getMeta, isHubOwner, renameHub, saveMeta } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'

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
  return NextResponse.json({ pin: meta.pin, editors: meta.editors, slug: meta.slug })
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

  let body: { pin?: string | null; removeEditor?: string; newSlug?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  let current = meta

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
