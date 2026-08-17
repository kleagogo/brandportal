import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'

// The marketing site lives on Framer at pitho.io. This app answers on
// app.pitho.io, so its root is a doorway rather than a page: people who are
// already signed in land in their client spaces, and everyone else gets the
// sign-in form. That is what makes "Sign in" on the marketing site open the
// dashboard directly for a returning customer.
export const dynamic = 'force-dynamic'

export default async function Home() {
  redirect(await getSessionUser() ? '/dashboard' : '/login')
}
