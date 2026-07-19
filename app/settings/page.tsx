import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { listHubsForUser } from '@/lib/store'
import { AccountMenu } from '@/app/dashboard/parts'
import { ChangeEmail, LeaveHubButton, DeleteAccount } from './parts'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Account settings — Brand Portal' }

export default async function SettingsPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const hubs = await listHubsForUser(user)

  return (
    <div className="min-h-screen bg-[#f9f9f8]">
      <nav className="border-b border-[#e8e7e4] bg-white px-5 sm:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#1a1a1a] rounded-md flex items-center justify-center">
              <div className="w-3 h-3 rounded-sm border-[1.5px] border-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Brand Portal</span>
          </Link>
          <Link href="/dashboard" className="text-[13px] text-[#8a8a85] hover:text-[#1a1a1a] transition-colors">Your hubs</Link>
        </div>
        <AccountMenu email={user.email} />
      </nav>

      <main className="max-w-[560px] mx-auto px-5 sm:px-8 py-10">
        <h1 className="text-[24px] font-bold tracking-tight mb-1">Account settings</h1>
        <p className="text-[13.5px] text-[#8a8a85] mb-8">Your account, your hubs, and the exit doors.</p>

        {/* Profile */}
        <section className="bg-white border border-[#e8e7e4] rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between gap-4 mb-1">
            <p className="text-[13px] font-medium text-[#1a1a1a]">Email</p>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#f0efec] text-[#8a8a85]">
              {user.plan === 'pro' ? 'Pro' : 'Free plan'}
            </span>
          </div>
          <p className="text-[14px] text-[#6b6b66] mb-4">{user.email}</p>
          <ChangeEmail />
        </section>

        {/* Hub memberships */}
        <section className="bg-white border border-[#e8e7e4] rounded-2xl p-6 mb-4">
          <p className="text-[13px] font-medium text-[#1a1a1a] mb-3">Your hubs</p>
          {hubs.length === 0 ? (
            <p className="text-[13px] text-[#8a8a85]">
              None yet — <Link href="/" className="underline underline-offset-2">scan your website</Link> to create one.
            </p>
          ) : (
            <div className="space-y-2">
              {hubs.map(({ hub, role }) => (
                <div key={hub.slug} className="flex items-center justify-between gap-3 py-1">
                  <div className="min-w-0">
                    <Link href={`/${hub.slug}`} className="text-[14px] font-medium text-[#1a1a1a] hover:underline underline-offset-2">
                      {hub.name}
                    </Link>
                    <span className="text-[11px] text-[#b0afa9] ml-2 font-mono">/{hub.slug}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#f0efec] text-[#8a8a85]">{role}</span>
                    {role === 'editor' && <LeaveHubButton slug={hub.slug} name={hub.name} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Danger zone */}
        <section className="bg-white border border-red-100 rounded-2xl p-6">
          <p className="text-[13px] font-medium text-[#1a1a1a] mb-1">Delete account</p>
          <p className="text-[12.5px] text-[#8a8a85] mb-4">
            Deletes your account and every hub you own. Hubs you edit for others are unaffected — you’re just removed from them.
          </p>
          <DeleteAccount email={user.email} />
        </section>
      </main>
    </div>
  )
}
