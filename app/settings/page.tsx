import { PRIVATE_PAGE } from '@/lib/seo'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { listHubsForUser } from '@/lib/store'
import { AccountMenu } from '@/app/dashboard/parts'
import { ChangeEmail, LeaveHubButton, DeleteAccount } from './parts'

export const dynamic = 'force-dynamic'

export const metadata = { ...PRIVATE_PAGE, title: 'Account settings — Pitho' }

export default async function SettingsPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const hubs = await listHubsForUser(user)

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card px-5 sm:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-[14px]">P</span>
            <span className="text-[15px] font-semibold tracking-tight">Pitho</span>
          </Link>
          <Link href="/dashboard" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Your hubs</Link>
        </div>
        <AccountMenu email={user.email} />
      </nav>

      <main className="max-w-[560px] mx-auto px-5 sm:px-8 py-10">
        <h1 className="text-[24px] font-bold tracking-tight mb-1">Account settings</h1>
        <p className="text-[13.5px] text-muted-foreground mb-8">Your account, your hubs, and the exit doors.</p>

        {/* Profile */}
        <section className="bg-card border border-border rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between gap-4 mb-1">
            <p className="text-[13px] font-medium text-foreground">Email</p>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
              {user.plan === 'pro' ? 'Pro' : 'Free plan'}
            </span>
          </div>
          <p className="text-[14px] text-muted-foreground mb-4">{user.email}</p>
          <ChangeEmail />
        </section>

        {/* Hub memberships */}
        <section className="bg-card border border-border rounded-2xl p-6 mb-4">
          <p className="text-[13px] font-medium text-foreground mb-3">Your hubs</p>
          {hubs.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              None yet — <Link href="/" className="underline underline-offset-2">scan your website</Link> to create one.
            </p>
          ) : (
            <div className="space-y-2">
              {hubs.map(({ hub, role }) => (
                <div key={hub.slug} className="flex items-center justify-between gap-3 py-1">
                  <div className="min-w-0">
                    <Link href={`/${hub.slug}`} className="text-[14px] font-medium text-foreground hover:underline underline-offset-2">
                      {hub.name}
                    </Link>
                    <span className="text-[11px] text-muted-foreground/60 ml-2 font-mono">/{hub.slug}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground">{role}</span>
                    {role === 'editor' && <LeaveHubButton slug={hub.slug} name={hub.name} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Danger zone */}
        <section className="bg-card border border-destructive/20 rounded-2xl p-6">
          <p className="text-[13px] font-medium text-foreground mb-1">Delete account</p>
          <p className="text-[12.5px] text-muted-foreground mb-4">
            Deletes your account and every hub you own. Hubs you edit for others are unaffected — you’re just removed from them.
          </p>
          <DeleteAccount email={user.email} />
        </section>
      </main>
    </div>
  )
}
