'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { BrandConfig, SectionConfig } from '@/app/types/brand'
import { HubProvider, useHub } from './HubContext'
import { Icon } from './Icon'
import { ColorsSection } from './ColorsSection'
import { TypographySection } from './TypographySection'
import { AssetsSection } from './AssetsSection'
import { GuidelinesSection } from './GuidelinesSection'
import { BrandAgent } from './BrandAgent'
import { ShareModal } from './ShareModal'
import { SettingsModal } from './SettingsModal'
import { HomeSection } from './HomeSection'
import { SpaceSwitcher } from './SpaceSwitcher'
import { GooeyPlusMenu, StatusBadge } from '../transitions'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuAction,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger,
} from '@/components/ui/sidebar'

function SubBrandPlaceholder({ label }: { label: string }) {
  return (
    <div>
      <h1 className="text-[22px] font-bold tracking-tight mb-1">{label}</h1>
      <p className="text-[14px] text-muted-foreground mb-8">A sub-brand with its own colors, type, and assets.</p>
      <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary bg-primary/15 px-2.5 py-1 rounded-full mb-3">
          <Icon name="sparkles" size={11} /> Pro feature
        </span>
        <p className="text-[14px] font-medium text-foreground mb-1">Sub-brands are coming to Pro</p>
        <p className="text-[12px] text-muted-foreground/60">Nest a product line or campaign brand under this hub, with its own palette and assets.</p>
      </div>
    </div>
  )
}

export interface HubAccess {
  canEdit?: boolean
  isOwner?: boolean
  demo?: boolean
  signedIn?: boolean
}

export default function Hub({ initial, ...access }: { initial: BrandConfig } & HubAccess) {
  return (
    <HubProvider initial={initial} canEdit={Boolean(access.canEdit)}>
      <HubShell access={access} />
    </HubProvider>
  )
}

function HubShell({ access }: { access: HubAccess }) {
  const { config, active, saveState } = useHub()
  // Which section a share link should be scoped to, or '' for the whole hub.
  const [shareSection, setShareSection] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Light by default, remembered per browser.
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const saved = localStorage.getItem('bp_theme')
    if (saved) setDark(saved === 'dark')
  }, [])
  function toggleTheme() {
    setDark(d => {
      localStorage.setItem('bp_theme', d ? 'light' : 'dark')
      return !d
    })
  }

  // If the active section gets deleted, fall back to the first one.
  const activeSection = config.sections.find(s => s.id === active) || config.sections[0]

  // Load every brand font once, at hub level. React hoists <link> to <head>.
  const fontUrls = useMemo(() => {
    const urls = new Set<string>()
    for (const group of config.typography) {
      for (const font of group.fonts) {
        if (font.importUrl) urls.add(font.importUrl)
      }
    }
    return [...urls]
  }, [config.typography])

  function renderContent() {
    if (!activeSection) return null
    switch (activeSection.type) {
      case 'home':       return <HomeSection />
      case 'colors':     return <ColorsSection />
      case 'typography': return <TypographySection />
      case 'guidelines': return <GuidelinesSection />
      case 'subbrand':   return <SubBrandPlaceholder label={activeSection.label} />
      default:           return <AssetsSection sectionId={activeSection.id} />
    }
  }

  return (
    <div className={`${dark ? 'dark' : ''} h-screen overflow-hidden bg-background text-foreground flex flex-col`}>
      {fontUrls.map(url => <link key={url} rel="stylesheet" href={url} />)}

      <WelcomeToast />

      <SidebarProvider className="flex-1 min-h-0 items-stretch">
        <HubSidebar
          dark={dark}
          onToggleTheme={toggleTheme}
          onShareSection={setShareSection}
          onSettings={() => setSettingsOpen(true)}
          saveState={saveState}
          access={access}
        />

        <SidebarInset className="flex flex-col min-w-0 min-h-0">
          {/* No top bar: each section carries its own actions in the rail. This
              is the only thing left that has to sit outside the sidebar, so a
              phone can still open it. */}
          <SidebarTrigger className="md:hidden absolute left-3 top-3 z-20" />
          <main className="flex-1 min-h-0 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8">
              {renderContent()}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>

      {shareSection !== null && (
        <ShareModal
          section={shareSection || undefined}
          onClose={() => setShareSection(null)}
          isOwner={Boolean(access.isOwner)}
          canEdit={Boolean(access.canEdit)}
          demo={Boolean(access.demo)}
        />
      )}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      <BrandAgent />
    </div>
  )
}

// ─── One-time toast after receiving a hub ─────────────────────────────────────

function WelcomeToast() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('transferred')) {
      setMessage('You now own this hub. The previous owner stays on as an editor.')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  if (!message) return null
  return (
    <div className="bg-primary text-primary-foreground px-4 sm:px-6 py-2.5 flex items-center gap-3 text-[13px]">
      <span className="font-semibold shrink-0">🎉 Welcome!</span>
      <span className="text-primary-foreground/90 flex-1">{message}</span>
      <button onClick={() => setMessage('')} className="text-primary-foreground/70 hover:text-primary-foreground shrink-0" title="Dismiss">
        <Icon name="close" size={12} />
      </button>
    </div>
  )
}

/**
 * The hub's rail, on shadcn's Sidebar.
 *
 * Named HubSidebar because `Sidebar` is now the primitive. Mobile behaviour,
 * collapsing, the keyboard shortcut and the open-state cookie all come from the
 * primitive; what's kept here is the parts that are Pitho's — the editable
 * identity, the section groups, and the reorder/rename/delete controls that only
 * appear in edit mode.
 */
function HubSidebar({
  dark, onToggleTheme, onShareSection, onSettings, saveState, access,
}: {
  dark: boolean
  onToggleTheme: () => void
  onShareSection: (sectionId: string) => void
  onSettings: () => void
  saveState: 'idle' | 'saving' | 'saved' | 'error'
  access: HubAccess
}) {
  const { config, active, setActive, editingSection, update } = useHub()
  const SECTION_KINDS: Record<string, { label: string; icon: SectionConfig['icon'] }> = {
    assets: { label: 'New files', icon: 'screenshots' },
    colors: { label: 'New colors', icon: 'colors' },
    guidelines: { label: 'New guidelines', icon: 'guidelines' },
  }

  function addSection(type: SectionConfig['type'] = 'assets') {
    const kind = SECTION_KINDS[type] || SECTION_KINDS.assets
    update(c => {
      let n = c.sections.length + 1
      let id = `section-${n}`
      while (c.sections.some(s => s.id === id)) id = `section-${++n}`
      c.sections.push({ id, label: kind.label, type, icon: kind.icon })
      if (type === 'assets') c.assets[id] = []
    })
  }

  const GROUPS = [
    ['main', ''],
    ['assets', 'Assets'],
    ['subbrands', 'Sub Brands'],
    ['tools', 'Tools'],
    ['resources', 'Resources'],
  ] as const

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SpaceSwitcher currentSlug={config.slug} />
      </SidebarHeader>

      <SidebarContent>
        {GROUPS.map(([groupKey, groupLabel]) => {
          const items = config.sections
            .map((section, i) => ({ section, i }))
            .filter(({ section }) => (section.group || 'assets') === groupKey)
          if (items.length === 0) return null
          return (
            <SidebarGroup key={groupKey}>
              {groupLabel && <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map(({ section, i }) => (
                    <HubSidebarItem
                      key={section.id}
                      section={section}
                      index={i}
                      count={config.sections.length}
                      active={active === section.id}
                      onSelect={setActive}
                      onShare={onShareSection}
                      canEdit={Boolean(access.canEdit)}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {access.canEdit && (
          <div className="mb-1 flex justify-center group-data-[collapsible=icon]:hidden">
            {/* The plus splits into the section kinds — it used to always make an
                assets section, so choosing one was a rename away. */}
            <GooeyPlusMenu
              items={[
                { id: 'assets', label: 'Files', fx: '-54px', fy: '-34px', icon: <Icon name="screenshots" size={15} /> },
                { id: 'colors', label: 'Colors', fx: '0px', fy: '-64px', icon: <Icon name="colors" size={15} /> },
                { id: 'guidelines', label: 'Guidelines', fx: '54px', fy: '-34px', icon: <Icon name="guidelines" size={15} /> },
              ]}
              onSelect={item => addSection(item.id as SectionConfig['type'])}
            />
          </div>
        )}
        <SidebarMenu>
          {editingSection && (
            <SidebarMenuItem>
              <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                <StatusBadge state={saveState === 'saving' ? 'loading' : 'done'} label={saveState === 'saving' ? 'Saving' : 'Saved'} />
                {saveState === 'error' ? 'Couldn’t save' : saveState === 'saving' ? 'Saving…' : 'Saved'}
              </div>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onToggleTheme} tooltip={dark ? 'Light mode' : 'Dark mode'}>
              <Icon name={dark ? 'sun' : 'moon'} size={14} />
              <span>{dark ? 'Light mode' : 'Dark mode'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {access.isOwner && (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onSettings} tooltip="Hub settings">
                <Icon name="gear" size={14} />
                <span>Hub settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          {!access.canEdit && !access.signedIn && (
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/login" />} tooltip="Sign in">
                <Icon name="person" size={14} />
                <span>Sign in</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
        <Link href="/" className="px-2 text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors group-data-[collapsible=icon]:hidden">
          Made with Pitho
        </Link>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function HubSidebarItem({
  section, index, count, active, onSelect, onShare, canEdit,
}: {
  section: SectionConfig
  index: number
  count: number
  active: boolean
  onSelect: (id: string) => void
  onShare: (sectionId: string) => void
  canEdit: boolean
}) {
  const { editingSection, setEditingSection, update } = useHub()
  const isEditing = editingSection === section.id

  // External links are just links; they have nothing to edit or share.
  if (section.type === 'link' && section.url) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={section.label}
          render={<a href={section.url} target="_blank" rel="noopener noreferrer" />}
        >
          <Icon name={section.icon} size={14} />
          <span>{section.label}</span>
          <Icon name="link" size={11} />
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      {isEditing ? (
        <SidebarMenuButton isActive={active} render={<div />} className="gap-1.5">
          <Icon name={section.icon} size={14} />
          <input
            value={section.label}
            autoFocus
            onChange={e => update(c => { c.sections[index].label = e.target.value })}
            onKeyDown={e => e.key === 'Enter' && setEditingSection(null)}
            className="flex-1 min-w-0 bg-transparent outline-none border-b border-dashed border-border focus:border-ring text-foreground"
          />
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton isActive={active} onClick={() => onSelect(section.id)} tooltip={section.label}>
          <Icon name={section.icon} size={14} />
          <span>{section.label}</span>
        </SidebarMenuButton>
      )}

      {/* Each section carries its own actions, revealed on hover — there is no
          top bar, and an action that belongs to one section shouldn't live in
          chrome shared by all of them. */}
      {canEdit && (
        <>
          <SidebarMenuAction
            showOnHover
            className="right-13"
            title={isEditing ? 'Done editing' : `Edit ${section.label}`}
            onClick={() => {
              onSelect(section.id)
              setEditingSection(isEditing ? null : section.id)
            }}
          >
            <Icon name={isEditing ? 'check' : 'edit'} size={11} />
          </SidebarMenuAction>
          <SidebarMenuAction
            showOnHover
            className="right-7"
            title={`Share ${section.label}`}
            onClick={() => onShare(section.id)}
          >
            <Icon name="share" size={11} />
          </SidebarMenuAction>
          <SidebarMenuAction
            showOnHover
            title={`Delete ${section.label}`}
            onClick={() => {
              if (!window.confirm(`Delete the "${section.label}" section?`)) return
              if (editingSection === section.id) setEditingSection(null)
              update(c => { c.sections.splice(index, 1) })
            }}
          >
            <Icon name="trash" size={11} />
          </SidebarMenuAction>
        </>
      )}
    </SidebarMenuItem>
  )
}
