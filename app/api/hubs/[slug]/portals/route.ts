import { NextRequest, NextResponse } from 'next/server'
import { canEditHub, createPortal, getHub, getMeta, listPortals } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'
import { normalizePortalInput } from '@/lib/portal-input'

/** Share portals for a hub — editors and the owner manage them. */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const meta = await getMeta(slug)
  const user = await getSessionUser()
  if (!canEditHub(meta, user)) {
    return NextResponse.json({ error: 'Only the hub’s editors can see share links' }, { status: 403 })
  }
  return NextResponse.json({ portals: await listPortals(slug) })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const meta = await getMeta(slug)
  const user = await getSessionUser()
  if (!canEditHub(meta, user)) {
    return NextResponse.json({ error: 'Only the hub’s editors can create share links' }, { status: 403 })
  }
  const hub = await getHub(slug)
  if (!hub) return NextResponse.json({ error: 'Hub not found' }, { status: 404 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const input = normalizePortalInput(body)
  if ('error' in input) return NextResponse.json({ error: input.error }, { status: 400 })

  const portal = await createPortal({
    slug,
    name: input.value.name || `${hub.name} share`,
    template: input.value.template ?? 'full',
    sections: input.value.sections,
    password: input.value.password ?? null,
    expiresAt: input.value.expiresAt ?? null,
    allowDownload: input.value.allowDownload ?? true,
    branding: input.value.branding,
  })
  return NextResponse.json({ portal })
}
