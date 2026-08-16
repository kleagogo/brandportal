import { PRIVATE_PAGE } from '@/lib/seo'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { isExpired, listHubsForUser } from '@/lib/store'
import { limitsFor } from '@/lib/limits'
import { labelsFor } from '@/lib/labels'
import { NewHubButton, AccountMenu, StudioSetup, AccountTypePicker } from './parts'
import { HubCardStack } from './HubCardStack'

export const dynamic = 'force-dynamic'

export const metadata = { ...PRIVATE_PAGE, title: { absolute: 'Client spaces — Pitho' } }

/** The first few image assets in a hub, for the card's fanning stack. */
function previewImages(assets: Record<string, Array<{ file?: string }>>): string[] {
  const out: string[] = []
  for (const list of Object.values(assets || {})) {
    for (const a of Array.isArray(list) ? list : []) {
      if (a?.file && /\.(svg|png|jpg|jpeg|webp|gif)(\?|$)/i.test(a.file)) out.push(a.file)
      if (out.length === 3) return out
    }
  }
  return out
}

/** Count assets across all sections, for the card subtitle. */
function assetCount(assets: Record<string, unknown[]>): number {
  return Object.values(assets || {}).reduce((n, list) => n + (Array.isArray(list) ? list.length : 0), 0)
}

export default async function DashboardPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const hubs = await listHubsForUser(user)
  const limits = limitsFor(user)
  const labels = labelsFor(user.accountType)

  // The studio hub is the account's own brand; everything else is client work.
  const studio = hubs.find(h => h.role === 'owner' && h.meta.studio) || null
  const clients = hubs.filter(h => h !== studio)
  const ownedClients = clients.filter(h => h.role === 'owner').length
  const sharedCount = clients.length - ownedClients

  // Asked once, on a genuinely empty account. Anyone already using Pitho keeps
  // the wording they've had rather than being stopped for a question.
  const askWhatFor = !user.accountType && hubs.length === 0

  return (
    <div className="min-h-screen bg-[#f9f9f8]">
      <nav className="border-b border-[#e8e7e4] bg-white px-5 sm:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-md bg-[#1a1a1a] text-white flex items-center justify-center font-bold text-[14px]">P</span>
          <span className="text-[15px] font-semibold tracking-tight">Pitho</span>
        </Link>
        <AccountMenu email={user.email} />
      </nav>

      <main className="max-w-[900px] mx-auto px-5 sm:px-8 py-10 flex flex-col gap-10">

        {askWhatFor ? (
          <AccountTypePicker />
        ) : (
          <>
            {/* ── The account's own brand — hub zero ────────────────────────── */}
            <section>
              <div className="mb-4">
                <h2 className="text-[13px] font-semibold uppercase tracking-widest text-[#b0afa9]">{labels.ownHeading}</h2>
              </div>

              {studio ? (
                <Link
                  href={`/${studio.hub.slug}`}
                  className="block bg-white border border-[#e8e7e4] rounded-2xl p-5 hover:border-[#1a1a1a] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 shrink-0 rounded-xl bg-[#f9f9f8] border border-[#e8e7e4] flex items-center justify-center p-2.5">
                      {studio.hub.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={studio.hub.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] text-white flex items-center justify-center font-bold text-[14px]">
                          {studio.hub.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-semibold text-[#1a1a1a] truncate">{studio.hub.name}</p>
                      <p className="text-[12.5px] text-[#8a8a85] truncate">
                        {assetCount(studio.hub.assets)} assets · /{studio.hub.slug}
                      </p>
                      <p className="text-[12px] text-[#b0afa9] mt-1.5">{labels.ownCardNote}</p>
                    </div>
                  </div>
                </Link>
              ) : (
                <StudioSetup labels={labels} />
              )}
            </section>

            {/* ── Everything else ──────────────────────────────────────────── */}
            <section>
              <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
                <div>
                  <h2 className="text-[13px] font-semibold uppercase tracking-widest text-[#b0afa9] mb-1">{labels.othersHeading}</h2>
                  <p className="text-[13.5px] text-[#8a8a85]">
                    {ownedClients} of {limits.hubs} used{sharedCount > 0 ? ` · ${sharedCount} shared with you` : ''}
                  </p>
                </div>
                <NewHubButton labels={labels} />
              </div>

              {clients.length === 0 ? (
                <div className="border-2 border-dashed border-[#e8e7e4] rounded-2xl p-10 text-center">
                  <p className="text-[15px] font-medium text-[#1a1a1a] mb-1">{labels.emptyTitle}</p>
                  <p className="text-[13px] text-[#8a8a85]">{labels.emptyBody}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clients.map(({ hub, meta, role }) => (
                    <Link
                      key={hub.slug}
                      href={`/${hub.slug}`}
                      className="bg-white border border-[#e8e7e4] rounded-2xl overflow-hidden hover:border-[#1a1a1a] transition-colors group"
                    >
                      <div className="h-24 bg-[#f9f9f8] border-b border-[#e8e7e4] flex items-center justify-center p-5">
                        {/* Three assets from inside, fanning on hover — the card
                            shows what the space holds, not just its initial. */}
                        <HubCardStack
                          images={previewImages(hub.assets)}
                          logoUrl={hub.logoUrl}
                          fallback={hub.name.charAt(0).toUpperCase()}
                        />
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
            </section>
          </>
        )}
      </main>
    </div>
  )
}
