'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RiExpandUpDownLine } from '@remixicon/react'
import { Icon } from './Icon'
import { useHub } from './HubContext'
import { Editable } from './Editable'
import { NewSpaceModal } from './NewSpaceModal'
import { localPreview, uploadAsset } from './upload-client'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'

interface Space {
  slug: string
  name: string
  client?: string
  logoUrl: string | null
  role: 'owner' | 'editor'
  /** The account's own brand, as opposed to a client's. */
  studio?: boolean
}

interface DemoHub {
  slug: string
  name: string
  tagline: string
  logoUrl: string | null
}

/**
 * The sidebar header, as shadcn's switcher: the hub you're in, and a dropdown
 * onto the others.
 *
 * This is where an agency lives day to day, so the other brands belong here
 * rather than tucked in the footer. The identity stays editable in place — the
 * name and tagline are the hub's own data, not chrome — so in edit mode the
 * trigger yields to inputs.
 */
export function SpaceSwitcher({ currentSlug, kindLabel }: { currentSlug: string; kindLabel: string }) {
  const { config, editing, update, sandbox } = useHub()
  const router = useRouter()
  const [spaces, setSpaces] = useState<Space[]>([])
  const [demoHubs, setDemoHubs] = useState<DemoHub[]>([])
  const [signedIn, setSignedIn] = useState(false)
  const [newSpaceOpen, setNewSpaceOpen] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [logoBusy, setLogoBusy] = useState(false)

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(d => {
        setSignedIn(Boolean(d.user))
        setSpaces(d.user ? d.hubs : [])
        setDemoHubs(d.demoHubs || [])
      })
      .catch(() => setSpaces([]))
  }, [])

  // The studio is the account's own brand and the hub every client space is
  // copied from, so it sits at the top on its own rather than in a list of
  // clients it isn't one of. The clients get a heading only when there are
  // some: a heading over nothing is just a word.
  const studioHub = spaces.find(s => s.studio && s.slug !== currentSlug) || null
  const others = spaces.filter(s => !s.studio && s.slug !== currentSlug)

  /**
   * The shipped hubs have the same shape as a real account: the first is the
   * agency, the rest are its clients.
   *
   * That shape was being flattened into one list, so the agency read as a
   * client of itself — and once you were inside a client space the agency was
   * filtered out along with the hub you were standing in, leaving no way
   * back to it. On a demo hub this hierarchy is the one on screen, whether or
   * not anyone is signed in; their own spaces are still a click away under
   * All spaces.
   */
  const inDemo = sandbox && demoHubs.length > 0
  const demoRoot = demoHubs[0] || null
  const demoClients = demoHubs.slice(1)

  /**
   * In the demo, the subtitle says which kind of hub you're standing in
   * rather than repeating that it's a demo — the banner overhead already
   * says that, and "Demo hub" under both made the agency and its client look
   * like the same kind of thing.
   */
  const label = inDemo
    ? (demoRoot && currentSlug === demoRoot.slug ? 'Main account' : 'Client space')
    : kindLabel

  const rootHub = inDemo
    ? (demoRoot && demoRoot.slug !== currentSlug ? demoRoot : null)
    : studioHub
  const clientHubs = inDemo ? demoClients.filter(h => h.slug !== currentSlug) : []
  // Signed out and away from the demo, the examples are the only place the
  // one-hub-per-client shape is visible before signing up.
  const exampleHubs = inDemo ? [] : demoHubs.filter(h => h.slug !== currentSlug)
  const showExamples = !signedIn && !inDemo && exampleHubs.length > 0

  async function pickLogo(file: File) {
    setLogoBusy(true)
    try {
      const result = sandbox ? localPreview(file) : await uploadAsset(file, config.slug)
      update(c => { c.logoUrl = result.url })
    } catch {
      // A failed logo upload just keeps the current mark.
    } finally {
      setLogoBusy(false)
    }
  }

  const mark = config.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={config.logoUrl} alt="" className="max-h-full max-w-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
  ) : (
    <span className="text-[13px] font-bold">{config.name.charAt(0).toUpperCase()}</span>
  )

  /**
   * The slot a client's logo sits in.
   *
   * A logo gets no surface of its own and room to be its own shape. Filling the
   * box hid any logo that shared that colour, and forcing a square squeezed a
   * wordmark down to an unreadable smear. A logo that wants a coloured ground
   * carries one, the way an app icon does. Only the initial fallback keeps the
   * filled square, because a single letter wants one.
   */
  const slot = config.logoUrl
    ? 'h-8 w-auto min-w-8 max-w-[120px]'
    : 'aspect-square size-8 bg-primary text-primary-foreground'

  const identity = (
    <>
      <div className={`flex items-center justify-center rounded-lg overflow-hidden shrink-0 ${slot}`}>
        {mark}
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
        <span className="truncate font-medium">{config.name}</span>
        <span className="truncate text-xs text-muted-foreground">{label}</span>
      </div>
    </>
  )

  // Editing the brand's own name has to stay possible, and a dropdown trigger
  // would swallow the clicks. The mark becomes the logo picker here too.
  if (editing) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" render={<div />}>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              title={config.logoUrl ? 'Change logo' : 'Add your logo'}
              className={`group/logo relative flex items-center justify-center rounded-lg overflow-hidden shrink-0 transition-colors ${
                config.logoUrl
                  ? slot
                  : 'aspect-square size-8 border border-dashed border-muted-foreground/50 text-muted-foreground hover:border-ring hover:text-foreground'
              }`}
            >
              {logoBusy ? (
                <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : config.logoUrl ? (
                <>
                  {mark}
                  <span className="absolute inset-0 hidden items-center justify-center bg-foreground/70 text-background group-hover/logo:flex">
                    <Icon name="edit" size={12} />
                  </span>
                </>
              ) : (
                <Icon name="upload" size={13} />
              )}
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) pickLogo(f); e.target.value = '' }}
            />
            <div className="grid flex-1 gap-0.5 text-left leading-tight min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="text-[13px] font-semibold">
                <Editable value={config.name} placeholder="Brand name" onChange={v => update(c => { c.name = v })} />
              </span>
              <span className="text-[11px] text-muted-foreground">{config.logoUrl ? label : 'Click the box to add a logo'}</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground">
                {identity}
                <RiExpandUpDownLine className="ml-auto size-4 shrink-0" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            // Down, not out to the side: the rail is narrow and a side popup
            // covers the content you're about to switch away from.
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={6}
          >
            <DropdownMenuGroup>
              {/* The way back. Named as what it is, because a bare brand name
                  in a list of brand names is not a way home — from inside a
                  client space this row was indistinguishable from a client. */}
              {rootHub && (
                <DropdownMenuItem onClick={() => router.push(`/${rootHub.slug}`)} className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-md border overflow-hidden shrink-0">
                    {rootHub.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={rootHub.logoUrl} alt="" className="size-full object-contain" />
                    ) : (
                      <span className="text-[10px] font-bold">{rootHub.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="grid min-w-0 flex-1 leading-tight">
                    <span className="truncate font-medium">{rootHub.name}</span>
                    <span className="truncate text-xs text-muted-foreground">Main account</span>
                  </div>
                </DropdownMenuItem>
              )}
              {(others.length > 0 || clientHubs.length > 0 || showExamples) && (
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  {showExamples ? 'Example client hubs' : 'Client spaces'}
                </DropdownMenuLabel>
              )}
              {clientHubs.map(h => (
                <DropdownMenuItem key={h.slug} onClick={() => router.push(`/${h.slug}`)} className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-md border overflow-hidden shrink-0">
                    {h.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.logoUrl} alt="" className="size-full object-contain" />
                    ) : (
                      <span className="text-[10px] font-bold">{h.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="truncate">{h.name}</span>
                </DropdownMenuItem>
              ))}
              {showExamples && exampleHubs.map(h => (
                <DropdownMenuItem key={h.slug} onClick={() => router.push(`/${h.slug}`)} className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-md border overflow-hidden shrink-0">
                    {h.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.logoUrl} alt="" className="size-full object-contain" />
                    ) : (
                      <span className="text-[10px] font-bold">{h.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="truncate">{h.name}</span>
                </DropdownMenuItem>
              ))}
              {others.map(s => (
              <DropdownMenuItem key={s.slug} onClick={() => router.push(`/${s.slug}`)} className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border overflow-hidden shrink-0">
                  {s.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.logoUrl} alt="" className="size-full object-contain" />
                  ) : (
                    <span className="text-[10px] font-bold">{(s.client || s.name).charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="truncate">{s.client || s.name}</span>
              </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            {(others.length > 0 || signedIn || showExamples || clientHubs.length > 0 || rootHub) && <DropdownMenuSeparator />}
            {/* Shown signed out as well. A visitor asking "can each client have
                their own?" got no answer here, and the demo is where they ask.
                Without an account there is nothing to create yet, so it opens
                sign-in and comes back. */}
            <DropdownMenuItem
              onClick={() => (signedIn ? setNewSpaceOpen(true) : router.push(`/login?redirect=/${currentSlug}`))}
              className="gap-2 p-2"
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent shrink-0">
                <Icon name="plus" size={12} />
              </div>
              <span className="font-medium">New client hub</span>
            </DropdownMenuItem>
            {signedIn && (
              <DropdownMenuItem onClick={() => router.push('/dashboard?all=1')} className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent shrink-0">
                  <Icon name="spaces" size={12} />
                </div>
                <span className="text-muted-foreground font-medium">All spaces</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      {newSpaceOpen && <NewSpaceModal onClose={() => setNewSpaceOpen(false)} />}
    </SidebarMenu>
  )
}
