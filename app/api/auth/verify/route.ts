import { NextRequest, NextResponse } from 'next/server'
import { consumeToken } from '@/lib/tokens'
import { ensureUser, getUserById, updateUserEmail } from '@/lib/users'
import { SESSION_COOKIE, createSessionValue } from '@/lib/auth'
import { countOwnedHubs, createHub, deletePreview, getMeta, getPreview, renameEditorEmail, saveMeta, transferOwnership } from '@/lib/store'
import { limitsFor } from '@/lib/limits'

/** The destination of every magic link: sign in, then act on the token's purpose. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''
  const record = await consumeToken(token)
  if (!record) {
    return NextResponse.redirect(new URL('/login?invalid=1', req.nextUrl.origin))
  }

  // Email change: verified by clicking the link sent to the NEW address.
  if (record.purpose === 'email-change' && record.userId) {
    const account = await getUserById(record.userId)
    if (account) {
      const oldEmail = account.email
      await updateUserEmail(account.id, record.email)
      await renameEditorEmail(oldEmail, record.email)
    }
    const res = NextResponse.redirect(new URL('/settings?email-changed=1', req.nextUrl.origin))
    if (account) {
      res.cookies.set(SESSION_COOKIE, await createSessionValue(account.id), {
        httpOnly: true, sameSite: 'lax', secure: req.nextUrl.protocol === 'https:', maxAge: 90 * 24 * 3600, path: '/',
      })
    }
    return res
  }

  const user = await ensureUser(record.email)
  let destination = record.redirect || '/dashboard'

  if (record.purpose === 'claim' && record.previewId) {
    const config = await getPreview(record.previewId)
    if (!config) {
      destination = '/?expired=1'
    } else if ((await countOwnedHubs(user.id)) >= limitsFor(user).hubs) {
      destination = '/dashboard?limit=1'
    } else {
      const hub = await createHub(config, user.id)
      await deletePreview(record.previewId)
      destination = `/${hub.slug}?claimed=1`
    }
  }

  if (record.purpose === 'invite' && record.slug) {
    const meta = await getMeta(record.slug)
    if (!meta.demo && meta.ownerId !== user.id && !meta.editors.includes(user.email)) {
      await saveMeta({ ...meta, editors: [...meta.editors, user.email] })
    }
    destination = `/${record.slug}`
  }

  // Ownership transfer: the new owner accepts by clicking their link.
  if (record.purpose === 'transfer' && record.slug) {
    const meta = await getMeta(record.slug)
    if (!meta.demo) {
      const oldOwner = meta.ownerId ? await getUserById(meta.ownerId) : null
      await transferOwnership(record.slug, user.id, user.email, oldOwner?.email)
    }
    destination = `/${record.slug}?transferred=1`
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
