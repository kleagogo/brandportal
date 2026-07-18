import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getHub } from '@/lib/store'
import Hub from '@/app/components/hub/Hub'

// The hub is always read fresh from the store — edits must show up immediately.
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const hub = await getHub()
  if (slug !== hub.slug) return {}
  return {
    title: `${hub.name} — Brand Hub`,
    description: hub.tagline,
  }
}

export default async function HubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const hub = await getHub()
  if (slug !== hub.slug) notFound()
  return <Hub initial={hub} />
}
