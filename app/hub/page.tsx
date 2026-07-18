import { redirect } from 'next/navigation'
import { getHub } from '@/lib/store'

// Legacy route — the hub now lives at /<slug>.
export const dynamic = 'force-dynamic'

export default async function HubRedirect() {
  const hub = await getHub()
  redirect(`/${hub.slug}`)
}
