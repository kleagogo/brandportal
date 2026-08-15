import { PRIVATE_PAGE } from '@/lib/seo'
import { redirect } from 'next/navigation'
import seed from '@/brand.config'

// Legacy route — hubs now live at /<slug>; send visitors to the demo hub.
export const metadata = { ...PRIVATE_PAGE, title: 'Hub — Pitho' }

export default function HubRedirect() {
  redirect(`/${seed.slug}`)
}
