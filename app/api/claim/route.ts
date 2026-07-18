import { NextRequest, NextResponse } from 'next/server'
import { createHub, deletePreview, getPreview } from '@/lib/store'

/**
 * Turn a scan preview into a real, editable hub.
 * v1 has no accounts yet — claiming is open. Auth wraps this endpoint later.
 */
export async function POST(req: NextRequest) {
  let previewId: string
  try {
    ({ previewId } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (!previewId || typeof previewId !== 'string') {
    return NextResponse.json({ error: 'previewId is required' }, { status: 400 })
  }

  const config = await getPreview(previewId)
  if (!config) {
    return NextResponse.json({ error: 'This preview has expired — scan your site again' }, { status: 410 })
  }

  const hub = await createHub(config)
  await deletePreview(previewId)
  return NextResponse.json({ slug: hub.slug })
}
