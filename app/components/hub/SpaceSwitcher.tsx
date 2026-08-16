'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RiExpandUpDownLine } from '@remixicon/react'
import { Icon } from './Icon'
import { useHub } from './HubContext'
import { Editable } from './Editable'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'

interface Space {
  slug: string
  name: string
  client?: string
  logoUrl: string | null
  role: 'owner' | 'editor'
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
export function SpaceSwitcher({ currentSlug }: { currentSlug: string }) {
  const { config, editing, update } = useHub()
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [spaces, setSpaces] = useState<Space[]>([])

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(d => setSpaces(d.user ? d.hubs : []))
      .catch(() => setSpaces([]))
  }, [])

  const others = spaces.filter(s => s.slug !== currentSlug)

  const mark = config.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={config.logoUrl} alt="" className="size-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
  ) : (
    <span className="text-[13px] font-bold">{config.name.charAt(0).toUpperCase()}</span>
  )

  const identity = (
    <>
      <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden shrink-0">
        {mark}
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
        <span className="truncate font-medium">{config.name}</span>
        <span className="truncate text-xs text-muted-foreground">{config.tagline}</span>
      </div>
    </>
  )

  // Editing the brand's own name and tagline has to stay possible, and a
  // dropdown trigger would swallow the clicks.
  if (editing) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" render={<div />}>
            {identity}
          </SidebarMenuButton>
          <div className="px-2 pt-1 group-data-[collapsible=icon]:hidden">
            <p className="text-[13px] font-semibold leading-tight truncate">
              <Editable value={config.name} placeholder="Brand name" onChange={v => update(c => { c.name = v })} />
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              <Editable value={config.tagline} placeholder="Tagline" onChange={v => update(c => { c.tagline = v })} />
            </p>
          </div>
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
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                {others.length ? 'Your other brands' : 'Brands'}
              </DropdownMenuLabel>
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
            {others.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={() => router.push('/dashboard')} className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent shrink-0">
                <Icon name="plus" size={12} />
              </div>
              <span className="text-muted-foreground font-medium">All spaces</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
