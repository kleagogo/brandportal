import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { canEditHub, getHub, getMeta, isHubOwner } from '@/lib/store'
import { getSessionUser, pinCookieName, pinCookieValue } from '@/lib/auth'
import Hub from '@/app/components/hub/Hub'
import { PinGate } from '@/app/components/hub/PinGate'

// Hubs are always read fresh from the store — edits must show up immediately.
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const hub = await getHub(slug)
  if (!hub) return {}
  return {
    title: `${hub.name} — Brand Hub`,
    description: hub.tagline,
    ...(hub.logoUrl ? { icons: { icon: hub.logoUrl } } : {}),
  }
}

export default async function HubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const hub = await getHub(slug)
  if (!hub) notFound()

  const meta = await getMeta(slug)
  const user = await getSessionUser()
  const canEdit = canEditHub(meta, user)
  const isOwner = isHubOwner(meta, user)

  // PIN gate for outside viewers; editors and the owner pass straight through.
  if (meta.pin && !canEdit) {
    const store = await cookies()
    const unlocked = store.get(pinCookieName(slug))?.value === await pinCookieValue(slug, meta.pin)
    if (!unlocked) return <PinGate slug={slug} name={hub.name} logoUrl={hub.logoUrl} />
  }

  return (
    <Hub
      initial={hub}
      canEdit={canEdit}
      isOwner={isOwner}
      demo={Boolean(meta.demo)}
      signedIn={Boolean(user)}
    />
  )
}
