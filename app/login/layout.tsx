import { PRIVATE_PAGE } from '@/lib/seo'

/**
 * The page itself is a client component and so can't carry metadata; this
 * exists to give the tab a name of its own rather than the site-wide one.
 */
export const metadata = { ...PRIVATE_PAGE, title: 'Start free' }

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
