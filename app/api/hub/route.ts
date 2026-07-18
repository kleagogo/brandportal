import { NextRequest, NextResponse } from 'next/server'
import { getHub, saveHub } from '@/lib/store'
import type { BrandConfig } from '@/app/types/brand'

export async function GET() {
  return NextResponse.json(await getHub())
}

export async function PUT(req: NextRequest) {
  let body: BrandConfig
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const problem = validate(body)
  if (problem) return NextResponse.json({ error: problem }, { status: 400 })

  // The slug is the hub's address — it can't be changed from the editor (yet),
  // so a stray payload can't move the hub out from under its share links.
  const current = await getHub()
  const saved = await saveHub({ ...body, slug: current.slug })
  return NextResponse.json({ ok: true, updatedAt: saved.updatedAt })
}

function validate(c: BrandConfig): string | null {
  if (!c || typeof c !== 'object') return 'Config must be an object'
  if (typeof c.name !== 'string' || !c.name.trim()) return 'Brand name is required'
  if (typeof c.tagline !== 'string') return 'Tagline must be a string'
  if (!Array.isArray(c.colors)) return 'colors must be an array'
  if (!Array.isArray(c.typography)) return 'typography must be an array'
  if (!Array.isArray(c.sections) || c.sections.length === 0) return 'At least one section is required'
  if (!c.assets || typeof c.assets !== 'object') return 'assets must be an object'
  if (!c.guidelines || typeof c.guidelines !== 'object') return 'guidelines must be an object'
  for (const group of c.colors) {
    if (typeof group.group !== 'string' || !Array.isArray(group.swatches)) return 'Malformed color group'
    for (const s of group.swatches) {
      if (typeof s.name !== 'string' || typeof s.hex !== 'string') return 'Malformed swatch'
    }
  }
  for (const s of c.sections) {
    if (typeof s.id !== 'string' || typeof s.label !== 'string' || typeof s.type !== 'string') return 'Malformed section'
  }
  return null
}
