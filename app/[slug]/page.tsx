import type { Metadata } from 'next'
import { PRIVATE_PAGE } from '@/lib/seo'
import { isShippedDemoHub } from '@/lib/demo-hubs'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { canEditHub, getHub, getMeta, isExpired, isHubOwner, isSandboxHub } from '@/lib/store'
import { getSessionUser, pinCookieName, pinCookieValue } from '@/lib/auth'
import Hub from '@/app/components/hub/Hub'
import { PinGate } from '@/app/components/hub/PinGate'

// Hubs are always read fresh from the store — edits must show up immediately.
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const hub = await getHub(slug)
  // Even the title of a hub that doesn't exist shouldn't be indexable.
  if (!hub) return PRIVATE_PAGE

  const icons = hub.logoUrl ? { icons: { icon: hub.logoUrl } } : {}

  // The demo is a real hub kept deliberately public — the best thing to show
  // someone deciding whether this is for them, and so the one hub worth
  // indexing. Its copy is written for a searcher, not for the client whose
  // brand it holds.
  if (isShippedDemoHub(slug, hub)) {
    const title = 'Brand hub demo: see a working brand hub'
    const description =
      'A live brand hub: logos, colours, fonts and guidelines in one place your clients can actually use. No signup, nothing to install.'
    return {
      title: { absolute: `${title} | Pitho` },
      description,
      alternates: { canonical: `/${slug}` },
      openGraph: { title, description, url: `/${slug}`, type: 'website', siteName: 'Pitho' },
      twitter: { card: 'summary_large_image', title, description },
      ...icons,
    }
  }

  return {
    ...PRIVATE_PAGE,
    // `absolute` stops the site-wide "%s — Pitho" template appending a second
    // "Pitho" to a hub that is already named.
    title: { absolute: `${hub.name} · Brand Hub` },
    description: hub.tagline,
    ...icons,
  }
}

export default async function HubPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ section?: string }>
}) {
  const { slug } = await params
  const hub = await getHub(slug)
  if (!hub) notFound()

  const meta = await getMeta(slug)
  const user = await getSessionUser()
  const canEdit = canEditHub(meta, user)
  const isOwner = isHubOwner(meta, user)
  // The demo hands out edit controls that write to nothing, so a visitor can
  // try uploading and renaming without leaving a trace for the next one.
  const sandbox = isSandboxHub(meta, user)

  // Expired share links close to outside viewers; editors keep access.
  if (isExpired(meta) && !canEdit) {
    return <PinGate slug={slug} name={hub.name} logoUrl={hub.logoUrl} expired />
  }

  // PIN/password gate for outside viewers; editors and the owner pass through.
  if (meta.pin && !canEdit) {
    const store = await cookies()
    const unlocked = store.get(pinCookieName(slug))?.value === await pinCookieValue(slug, meta.pin)
    if (!unlocked) return <PinGate slug={slug} name={hub.name} logoUrl={hub.logoUrl} />
  }

  // A link can name the section it means, so "look at this bit of the hub"
  // is one URL rather than an instruction to click around after arriving.
  // Resolved here rather than on the client, so the right section is in the
  // first paint instead of a flash of the wrong one.
  const { section } = await searchParams
  const openSection = hub.sections.some(s => s.id === section) ? section : undefined

  return (
    <Hub
      initial={hub}
      openSection={openSection}
      canEdit={canEdit || sandbox}
      sandbox={sandbox}
      isOwner={isOwner}
      demo={Boolean(meta.demo)}
      signedIn={Boolean(user)}
      email={user?.email}
      studio={Boolean(meta.studio)}
    />
  )
}
