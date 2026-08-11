import { NextRequest, NextResponse } from 'next/server'
import { canEditHub, deletePortal, getMeta, getPortal, savePortal } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'
import { normalizePortalInput } from '@/lib/portal-input'

/** Update or revoke one share portal. */

async function load(slug: string, id: string) {
  const meta = await getMeta(slug)
  const user = await getSessionUser()
  if (!canEditHub(meta, user)) return { error: 'Only the hub’s editors can manage share links', status: 403 as const }
  const portal = await getPortal(id)
  if (!portal || portal.slug !== slug) return { error: 'Share link not found', status: 404 as const }
  return { portal }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params
  const found = await load(slug, id)
  if ('error' in found) return NextResponse.json({ error: found.error }, { status: found.status })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const input = normalizePortalInput(body)
  if ('error' in input) return NextResponse.json({ error: input.error }, { status: 400 })

  const portal = await savePortal({ ...found.portal, ...input.value })
  return NextResponse.json({ portal })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params
  const found = await load(slug, id)
  if ('error' in found) return NextResponse.json({ error: found.error }, { status: found.status })
  await deletePortal(id)
  return NextResponse.json({ ok: true })
}
