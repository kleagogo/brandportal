import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { isExpired, listHubsForUser } from '@/lib/store'
import { limitsFor } from '@/lib/limits'
import { NewHubButton, AccountMenu } from './parts'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Client spaces — Pitho' }

/** Count assets across all sections, for the card subtitle. */
function assetCount(assets: Record<string, unknown[]>): number {
  return Object.values(assets || {}).reduce((n, list) => n + (Array.isArray(list) ? list.length : 0), 0)
}

export default async function DashboardPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const hubs = await listHubsForUser(user)
  const limits = limitsFor(user)
  const owned = hubs.filter(h => h.role === 'owner').length

  return (
    <div className="min-h-screen bg-[#f9f9f8]">
      <nav className="border-b border-[#e8e7e4] bg-white px-5 sm:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-md bg-[#1a1a1a] text-white flex items-center justify-center font-bold text-[14px]">B</span>
          <span className="text-[15px] font-semibold tracking-tight">Pitho</span>
        </Link>
        <AccountMenu email={user.email} />
      </nav>

      <main className="max-w-[900px] mx-auto px-5 sm:px-8 py-10">
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight">Client spaces</h1>
            <p className="text-[13.5px] text-[#8a8a85]">
              {owned} of {limits.hubs} used{hubs.length > owned ? ` · ${hubs.length - owned} shared with you` : ''}
            </p>
          </div>
          <NewHubButton />
        </div>

        {hubs.length === 0 ? (
          <div className="border-2 border-dashed border-[#e8e7e4] rounded-2xl p-12 text-center">
            <p className="text-[15px] font-medium text-[#1a1a1a] mb-1">No client spaces yet</p>
            <p className="text-[13px] text-[#8a8a85] mb-5">Create one per client — each gets its own brand hub and share link.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hubs.map(({ hub, meta, role }) => (
              <Link
                key={hub.slug}
                href={`/${hub.slug}`}
                className="bg-white border border-[#e8e7e4] rounded-2xl overflow-hidden hover:border-[#1a1a1a] transition-colors group"
              >
                <div className="h-24 bg-[#f9f9f8] border-b border-[#e8e7e4] flex items-center justify-center p-5">
                  {hub.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hub.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] text-white flex items-center justify-center font-bold text-[15px]">
                      {hub.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-[15px] font-semibold text-[#1a1a1a] truncate">{meta.client || hub.name}</p>
                  <p className="text-[12px] text-[#b0afa9] mb-3 truncate">
                    {assetCount(hub.assets)} assets · /{hub.slug}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#f0efec] text-[#8a8a85]">{role}</span>
                    {meta.pin && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#f0efec] text-[#8a8a85]">Protected</span>
                    )}
                    {isExpired(meta) && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-50 text-red-500">Link expired</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
