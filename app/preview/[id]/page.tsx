import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getPreview } from '@/lib/store'
import Hub from '@/app/components/hub/Hub'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const config = await getPreview(id)
  if (!config) return { title: 'Preview expired — Brand Portal' }
  return {
    title: `${config.name} — brand hub preview`,
    description: config.tagline,
    robots: { index: false },
  }
}

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const config = await getPreview(id)
  if (!config) redirect('/?expired=1')
  return <Hub initial={config} previewId={id} />
}
