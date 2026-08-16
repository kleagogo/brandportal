'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { BrandConfig, SectionConfig } from '@/app/types/brand'
import { HubProvider, useHub } from './HubContext'
import { Icon } from './Icon'
import { Editable } from './Editable'
import { ColorsSection } from './ColorsSection'
import { TypographySection } from './TypographySection'
import { AssetsSection } from './AssetsSection'
import { GuidelinesSection } from './GuidelinesSection'
import { BrandAgent } from './BrandAgent'
import { ShareModal } from './ShareModal'
import { SettingsModal } from './SettingsModal'
import { SearchBox } from './SearchBox'
import { HomeSection } from './HomeSection'
import { SpaceSwitcher } from './SpaceSwitcher'
import { uploadAsset } from './upload-client'
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
  const { config, editing, setEditing, saveState } = useHub()
  const [active, setActive] = useState(config.sections[0]?.id || 'logo')
  const [shareOpen, setShareOpen] = useState(false)
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
          active={activeSection?.id || ''}
          onSelect={setActive}
          dark={dark}
          onToggleTheme={toggleTheme}
        />

        <SidebarInset className="flex flex-col min-w-0 min-h-0">
          <TopBar
            onShare={() => setShareOpen(true)}
            onSettings={() => setSettingsOpen(true)}
            onNavigate={setActive}
            editing={editing}
            setEditing={setEditing}
            saveState={saveState}
            sectionLabel={activeSection?.label || ''}
            access={access}
          />
          <main className="flex-1 min-h-0 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8">
              {renderContent()}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>

      {shareOpen && (
        <ShareModal
          onClose={() => setShareOpen(false)}
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

// ─── Top bar ──────────────────────────────────────────────────────────────────

function TopBar({
  onShare, onSettings, onNavigate, editing, setEditing, saveState, sectionLabel, access,
}: {
  onShare: () => void
  onSettings: () => void
  onNavigate: (sectionId: string) => void
  editing: boolean
  setEditing: (v: boolean) => void
  saveState: 'idle' | 'saving' | 'saved' | 'error'
  sectionLabel: string
  access: HubAccess
}) {
  return (
    <header className="h-14 shrink-0 bg-card border-b border-border flex items-center gap-3 px-4 sm:px-6 sticky top-0 z-20">
      <SidebarTrigger className="-ml-1" />
      <p className="text-[13px] font-medium text-muted-foreground truncate">{sectionLabel}</p>
      <SearchBox onNavigate={onNavigate} />

      <div className="ml-auto flex items-center gap-2.5">
        {editing && (
          <span className={`text-[12px] font-medium hidden sm:flex items-center gap-1.5 ${
            saveState === 'error' ? 'text-destructive' : 'text-muted-foreground'
          }`}>
            {saveState === 'error' ? (
              'Couldn’t save — retrying on next edit'
            ) : (
              <>
                {/* The spinner resolving into a check IS the save state, so the
                    badge is driven straight off it rather than animated apart. */}
                <StatusBadge
                  state={saveState === 'saving' ? 'loading' : 'done'}
                  label={saveState === 'saving' ? 'Saving' : 'Saved'}
                />
                {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : 'All changes saved'}
              </>
            )}
          </span>
        )}

        {access.demo && access.canEdit && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-md hidden sm:block">
            Demo — anyone can edit
          </span>
        )}

        <button
          onClick={onShare}
          className="flex items-center gap-1.5 text-[13px] font-medium text-foreground border border-border hover:border-ring rounded-lg px-3 py-1.5 transition-colors"
        >
          <Icon name="share" size={13} /> Share
        </button>

        {access.isOwner && (
          <button
            onClick={onSettings}
            className="flex items-center text-muted-foreground hover:text-foreground border border-border hover:border-ring rounded-lg px-2 py-1.5 transition-colors"
            title="Hub settings"
          >
            <Icon name="gear" size={15} />
          </button>
        )}

        {access.canEdit ? (
          <button
            onClick={() => setEditing(!editing)}
            className={`flex items-center gap-1.5 text-[13px] font-semibold rounded-lg px-3.5 py-1.5 transition-colors ${
              editing
                ? 'bg-primary text-primary-foreground hover:opacity-85'
                : 'border border-border text-foreground hover:border-ring'
            }`}
          >
            {editing ? <><Icon name="check" size={13} /> Done</> : <><Icon name="edit" size={13} /> Edit</>}
          </button>
        ) : !access.signedIn ? (
          <Link
            href="/login"
            className="text-[13px] font-medium text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
        ) : null}
      </div>
    </header>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

/**
 * The hub's rail, on shadcn's Sidebar.
 *
 * Named HubSidebar because `Sidebar` is now the primitive. Mobile behaviour,
 * collapsing, the keyboard shortcut and the open-state cookie all come from the
 * primitive; what's kept here is the parts that are Pitho's — the editable
 * identity, the section groups, and the reorder/rename/delete controls that only
 * appear in edit mode.
 */
function HubSidebar({ active, onSelect, dark, onToggleTheme }: { active: string; onSelect: (id: string) => void; dark: boolean; onToggleTheme: () => void }) {
  const { config, editing, update } = useHub()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [logoUploading, setLogoUploading] = useState(false)

  async function uploadLogo(file: File) {
    setLogoUploading(true)
    try {
      const data = await uploadAsset(file, config.slug)
      update(c => { c.logoUrl = data.url })
    } catch {
      // Leave the current logo in place on failure.
    } finally {
      setLogoUploading(false)
    }
  }

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
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <button
            onClick={() => editing && logoInputRef.current?.click()}
            className={`w-9 h-9 shrink-0 rounded-lg overflow-hidden flex items-center justify-center ${
              editing ? 'cursor-pointer ring-1 ring-dashed ring-border hover:ring-foreground' : ''
            } ${logoUploading ? 'animate-pulse' : ''}`}
            title={editing ? 'Change logo' : undefined}
            disabled={!editing}
          >
            {config.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.logoUrl} alt={config.name} className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ) : (
              <div className="w-full h-full bg-primary rounded-lg" />
            )}
          </button>
          {/* Hidden when the rail collapses to icons. */}
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="text-[13px] font-semibold leading-tight truncate">
              <Editable value={config.name} placeholder="Brand name" onChange={v => update(c => { c.name = v })} />
            </p>
            <p className="text-[10px] text-muted-foreground/60 leading-tight mt-0.5">
              <Editable value={config.tagline} placeholder="Tagline" onChange={v => update(c => { c.tagline = v })} />
            </p>
          </div>
        </div>
        <input
          ref={logoInputRef}
          type="file"
          accept=".svg,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = '' }}
        />
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
                      onSelect={onSelect}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {editing && (
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
        <div className="group-data-[collapsible=icon]:hidden">
          <SpaceSwitcher currentSlug={config.slug} currentName={config.name} />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onToggleTheme} tooltip={dark ? 'Light mode' : 'Dark mode'}>
              <Icon name={dark ? 'sun' : 'moon'} size={14} />
              <span>{dark ? 'Light mode' : 'Dark mode'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
  section, index, count, active, onSelect,
}: {
  section: SectionConfig
  index: number
  count: number
  active: boolean
  onSelect: (id: string) => void
}) {
  const { editing, update } = useHub()

  if (section.type === 'link' && section.url && !editing) {
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

  if (!editing) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton isActive={active} onClick={() => onSelect(section.id)} tooltip={section.label}>
          <Icon name={section.icon} size={14} />
          <span>{section.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  // Edit mode: the label becomes an input, with reorder and delete on hover.
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={active} render={<div />} className="gap-1.5">
        <button onClick={() => onSelect(section.id)} className="text-muted-foreground shrink-0" title="Open section">
          <Icon name={section.icon} size={14} />
        </button>
        <input
          value={section.label}
          onChange={e => update(c => { c.sections[index].label = e.target.value })}
          onFocus={() => onSelect(section.id)}
          className="flex-1 min-w-0 text-[13px] bg-transparent outline-none border border-dashed border-transparent hover:border-border focus:border-ring rounded px-1 text-foreground"
        />
      </SidebarMenuButton>
      <SidebarMenuAction showOnHover className="right-6" title="Move up"
        onClick={() => index > 0 && update(c => {
          const [s] = c.sections.splice(index, 1)
          c.sections.splice(index - 1, 0, s)
        })}
      >
        <Icon name="up" size={11} />
      </SidebarMenuAction>
      <SidebarMenuAction showOnHover title="Delete section"
        onClick={() => {
          if (!window.confirm(`Delete the "${section.label}" section?`)) return
          update(c => { c.sections.splice(index, 1) })
        }}
      >
        <Icon name="trash" size={11} />
      </SidebarMenuAction>
    </SidebarMenuItem>
  )
}
