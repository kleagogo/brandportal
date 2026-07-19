import { NextRequest, NextResponse } from 'next/server'
import { createHub, deletePreview, getPreview } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'

/**
 * Turn a scan preview into a real, owned hub.
 * Signed-in users claim directly; signed-out users get { needAuth: true } and
 * the UI collects their email for a claim magic link instead.
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

  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ needAuth: true }, { status: 401 })
  }

  const hub = await createHub(config, user.id)
  await deletePreview(previewId)
  return NextResponse.json({ slug: hub.slug })
}
