import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { listHubsForUser } from '@/lib/store'
import { NewHubButton, AccountMenu } from './parts'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Your hubs — Brand Portal' }

export default async function DashboardPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const hubs = await listHubsForUser(user)

  return (
    <div className="min-h-screen bg-[#f9f9f8]">
      <nav className="border-b border-[#e8e7e4] bg-white px-5 sm:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#1a1a1a] rounded-md flex items-center justify-center">
            <div className="w-3 h-3 rounded-sm border-[1.5px] border-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Brand Portal</span>
        </Link>
        <AccountMenu email={user.email} />
      </nav>

      <main className="max-w-[760px] mx-auto px-5 sm:px-8 py-10">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight">Your hubs</h1>
            <p className="text-[13.5px] text-[#8a8a85]">Every brand you own or can edit.</p>
          </div>
          <NewHubButton />
        </div>

        {hubs.length === 0 ? (
          <div className="border-2 border-dashed border-[#e8e7e4] rounded-2xl p-12 text-center">
            <p className="text-[15px] font-medium text-[#1a1a1a] mb-1">No hubs yet</p>
            <p className="text-[13px] text-[#8a8a85] mb-5">Scan your website to build one in 30 seconds, or start blank.</p>
            <Link href="/" className="inline-block text-[13px] font-semibold bg-[#1a1a1a] text-white px-4 py-2.5 rounded-xl hover:bg-[#333] transition-colors">
              Scan my website →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hubs.map(({ hub, meta, role }) => (
              <Link
                key={hub.slug}
                href={`/${hub.slug}`}
                className="bg-white border border-[#e8e7e4] rounded-2xl p-5 hover:border-[#1a1a1a] transition-colors group"
              >
                <div className="flex items-center gap-3 mb-3">
                  {hub.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hub.logoUrl} alt="" className="w-9 h-9 rounded-lg object-contain" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-[#1a1a1a]" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-[#1a1a1a] truncate">{hub.name}</p>
                    <p className="text-[12px] text-[#b0afa9] font-mono truncate">/{hub.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#f0efec] text-[#8a8a85]">
                    {role}
                  </span>
                  {meta.pin && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#f0efec] text-[#8a8a85]">
                      PIN
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
