import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { canEditHub, getHub, getMeta } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'
import { ALLOWED_EXT, MIME, blobEnabled, extensionOf, maxUploadBytes } from '@/lib/uploads'

/**
 * Hands the browser a short-lived token so a large file can go straight to
 * blob storage, never passing through this app's request body limit.
 *
 * The token is only issued to someone who may already edit the hub, and it is
 * scoped to one filename of an allowed type.
 */
export async function POST(req: NextRequest) {
  if (!blobEnabled()) {
    return NextResponse.json({ error: 'Large uploads aren’t configured on this deployment' }, { status: 501 })
  }

  const body = (await req.json()) as HandleUploadBody

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const slug = String(clientPayload || '')
        const hub = await getHub(slug)
        const meta = await getMeta(slug)
        const user = await getSessionUser()
        if (!hub || !canEditHub(meta, user)) {
          throw new Error('You don’t have permission to upload to this hub')
        }
        const ext = extensionOf(pathname)
        if (!ALLOWED_EXT.has(ext)) throw new Error(`File type .${ext || '?'} is not supported`)
        return {
          allowedContentTypes: [MIME[ext] || 'application/octet-stream', 'application/octet-stream'],
          maximumSizeInBytes: maxUploadBytes(),
          addRandomSuffix: true,
          tokenPayload: slug,
        }
      },
      // Nothing to do on completion: the asset is recorded when the hub saves.
      onUploadCompleted: async () => {},
    })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 400 }
    )
  }
}
