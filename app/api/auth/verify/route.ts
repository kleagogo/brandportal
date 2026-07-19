import { NextRequest, NextResponse } from 'next/server'
import { consumeToken } from '@/lib/tokens'
import { ensureUser } from '@/lib/users'
import { SESSION_COOKIE, createSessionValue } from '@/lib/auth'
import { createHub, deletePreview, getMeta, getPreview, saveMeta } from '@/lib/store'

/** The destination of every magic link: sign in, then act on the token's purpose. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''
  const record = await consumeToken(token)
  if (!record) {
    return NextResponse.redirect(new URL('/login?invalid=1', req.nextUrl.origin))
  }

  const user = await ensureUser(record.email)
  let destination = record.redirect || '/dashboard'

  if (record.purpose === 'claim' && record.previewId) {
    const config = await getPreview(record.previewId)
    if (config) {
      const hub = await createHub(config, user.id)
      await deletePreview(record.previewId)
      destination = `/${hub.slug}?claimed=1`
    } else {
      destination = '/?expired=1'
    }
  }

  if (record.purpose === 'invite' && record.slug) {
    const meta = await getMeta(record.slug)
    if (!meta.demo && meta.ownerId !== user.id && !meta.editors.includes(user.email)) {
      await saveMeta({ ...meta, editors: [...meta.editors, user.email] })
    }
    destination = `/${record.slug}`
  }

  const res = NextResponse.redirect(new URL(destination, req.nextUrl.origin))
  res.cookies.set(SESSION_COOKIE, await createSessionValue(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.nextUrl.protocol === 'https:',
    maxAge: 90 * 24 * 3600,
    path: '/',
  })
  return res
}
