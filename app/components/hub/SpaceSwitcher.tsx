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

  const others = spaces.filter(s => s.slug !== currentSlug)
  // In the demo the visitor owns nothing, so `others` is empty and the menu
  // used to open onto a bare heading. The shipped example hubs stand in, which
  // is also the only place the one-hub-per-client shape is visible before
  // signing up. Keyed on having no brands rather than on being signed out, so
  // an account that hasn't built its first hub gets the same picture.
  const exampleHubs = demoHubs.filter(h => h.slug !== currentSlug)
  const showExamples = others.length === 0 && exampleHubs.length > 0

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
        <span className="truncate text-xs text-muted-foreground">{kindLabel}</span>
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
              <span className="text-[11px] text-muted-foreground">{config.logoUrl ? kindLabel : 'Click the box to add a logo'}</span>
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
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                {others.length ? 'Your other brands' : showExamples ? 'Example client hubs' : 'Brands'}
              </DropdownMenuLabel>
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
            {(others.length > 0 || signedIn || showExamples) && <DropdownMenuSeparator />}
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
              <DropdownMenuItem onClick={() => router.push('/dashboard')} className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent shrink-0">
                  <Icon name="spaces" size={12} />
                </div>
                <span className="text-muted-foreground font-medium">All spaces</span>
              </DropdownMenuItem>
            )}
            {/* The demo is nobody's space, so leaving it used to strand you:
                it vanished from this list the moment you switched away, and
                there was no route back short of typing the address. */}
            {signedIn && currentSlug !== 'demo' && (
              <DropdownMenuItem onClick={() => router.push('/demo')} className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent shrink-0">
                  <Icon name="sparkles" size={12} />
                </div>
                <span className="text-muted-foreground font-medium">Demo hub</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      {newSpaceOpen && <NewSpaceModal onClose={() => setNewSpaceOpen(false)} />}
    </SidebarMenu>
  )
}
