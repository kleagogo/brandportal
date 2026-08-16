import { PRIVATE_PAGE } from '@/lib/seo'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { listHubsForUser } from '@/lib/store'
import { Welcome } from './parts'

export const dynamic = 'force-dynamic'

export const metadata = { ...PRIVATE_PAGE, title: { absolute: 'Welcome — Pitho' } }

/**
 * Onboarding, for the first sign-in only.
 *
 * Signing up used to land on an empty dashboard, which asks someone to make
 * three decisions at once with nothing to show for any of them. This asks two
 * questions, and each one produces something: the answer names the product's
 * vocabulary, and the second creates a hub with a real palette in it.
 *
 * Anyone who already has a hub is sent on — this page is not a gate, and
 * bookmarking it shouldn't strand you.
 */
export default async function WelcomePage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const hubs = await listHubsForUser(user)
  if (hubs.length > 0) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border bg-card px-5 sm:px-8 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-[14px]">P</span>
          <span className="text-[15px] font-semibold tracking-tight">Pitho</span>
        </Link>
      </nav>

      <main className="flex-1 flex items-start justify-center px-5 sm:px-8 py-12 sm:py-16">
        <Welcome accountType={user.accountType ?? null} />
      </main>
    </div>
  )
}
