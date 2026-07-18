import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getHub } from '@/lib/store'
import Hub from '@/app/components/hub/Hub'

// Hubs are always read fresh from the store — edits must show up immediately.
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const hub = await getHub(slug)
  if (!hub) return {}
  return {
    title: `${hub.name} — Brand Hub`,
    description: hub.tagline,
  }
}

export default async function HubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const hub = await getHub(slug)
  if (!hub) notFound()
  return <Hub initial={hub} />
}
