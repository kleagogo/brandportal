import { PRIVATE_PAGE } from '@/lib/seo'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { createHub, getStudioHub, isExpired, listHubsForUser } from '@/lib/store'
import { blankHubConfig } from '@/lib/brand-builder'
import { limitsFor } from '@/lib/limits'
import { labelsFor } from '@/lib/labels'
import { NewHubButton, AccountMenu, StudioSetup } from './parts'
import { HubCardStack } from './HubCardStack'
import { Wordmark } from '@/app/components/Wordmark'

export const dynamic = 'force-dynamic'

export const metadata = { ...PRIVATE_PAGE, title: { absolute: 'Client spaces · Pitho' } }

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

  // A brand-new account skips setup questions entirely: their hub is made for
  // them and they land in it, on the Logo drop zone. Naming and everything
  // else can happen there, in place.
  if (hubs.length === 0) {
    const existing = await getStudioHub(user.id)
    if (existing) redirect(`/${existing.hub.slug}`)
    // Only a hub made just now earns the welcome; coming back to an existing
    // one shouldn't replay it.
    const hub = await createHub(blankHubConfig('Our studio', { kind: 'studio' }), user.id, { studio: true })
    redirect(`/${hub.slug}?new=1`)
  }

  const limits = limitsFor(user)
  const labels = labelsFor(user.accountType)

  // The studio hub is the account's own brand; everything else is client work.
  const studio = hubs.find(h => h.role === 'owner' && h.meta.studio) || null
  const clients = hubs.filter(h => h !== studio)
  const ownedClients = clients.filter(h => h.role === 'owner').length
  const sharedCount = clients.length - ownedClients

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card px-5 sm:px-8 h-14 flex items-center justify-between">
        <Wordmark />
        <AccountMenu email={user.email} />
      </nav>

      <main className="max-w-[900px] mx-auto px-5 sm:px-8 py-10 flex flex-col gap-10">

        <>
            {/* ── The account's own brand — hub zero ────────────────────────── */}
            <section>
              <div className="mb-4">
                <h2 className="text-[13px] font-semibold uppercase tracking-widest text-muted-foreground/60">{labels.ownHeading}</h2>
              </div>

              {studio ? (
                <Link
                  href={`/${studio.hub.slug}`}
                  className="block bg-card border border-border rounded-2xl p-5 hover:border-ring transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 shrink-0 rounded-xl bg-background border border-border flex items-center justify-center p-2.5">
                      {studio.hub.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={studio.hub.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-[14px]">
                          {studio.hub.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-semibold text-foreground truncate">{studio.hub.name}</p>
                      <p className="text-[12.5px] text-muted-foreground truncate">
                        {assetCount(studio.hub.assets)} assets · /{studio.hub.slug}
                      </p>
                      <p className="text-[12px] text-muted-foreground/60 mt-1.5">{labels.ownCardNote}</p>
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
                  <h2 className="text-[13px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">{labels.othersHeading}</h2>
                  <p className="text-[13.5px] text-muted-foreground">
                    {ownedClients} of {limits.hubs} used{sharedCount > 0 ? ` · ${sharedCount} shared with you` : ''}
                  </p>
                </div>
                <NewHubButton labels={labels} />
              </div>

              {clients.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center">
                  <p className="text-[15px] font-medium text-foreground mb-1">{labels.emptyTitle}</p>
                  <p className="text-[13px] text-muted-foreground">{labels.emptyBody}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clients.map(({ hub, meta, role }) => (
                    <Link
                      key={hub.slug}
                      href={`/${hub.slug}`}
                      className="bg-card border border-border rounded-2xl overflow-hidden hover:border-ring transition-colors group"
                    >
                      <div className="h-24 bg-background border-b border-border flex items-center justify-center p-5">
                        {/* Three assets from inside, fanning on hover — the card
                            shows what the space holds, not just its initial. */}
                        <HubCardStack
                          images={previewImages(hub.assets)}
                          logoUrl={hub.logoUrl}
                          fallback={hub.name.charAt(0).toUpperCase()}
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-[15px] font-semibold text-foreground truncate">{meta.client || hub.name}</p>
                        <p className="text-[12px] text-muted-foreground/60 mb-3 truncate">
                          {assetCount(hub.assets)} assets · /{hub.slug}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground">{role}</span>
                          {meta.pin && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground">Protected</span>
                          )}
                          {isExpired(meta) && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-destructive/10 text-destructive">Link expired</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
        </>
      </main>
    </div>
  )
}
