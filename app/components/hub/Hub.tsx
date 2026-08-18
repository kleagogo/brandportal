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
import { ShareModal } from './ShareModal'
import { SettingsModal } from './SettingsModal'
import { HomeSection } from './HomeSection'
import { SpaceSwitcher } from './SpaceSwitcher'
import { SearchOverlay } from './SearchOverlay'
import { ImportModal } from './ImportModal'
import { WelcomeModal } from './WelcomeModal'
import { useConfirm } from './useConfirm'
import { Button } from '@/components/ui/button'
import { IconSwap, TextSwap } from '../transitions'
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
  /** The account's own hub, as opposed to a client space. */
  studio?: boolean
  /**
   * The demo: edit controls work, but every change stays in this browser and
   * is gone on reload, so no visitor inherits the last one's mess.
   */
  sandbox?: boolean
}

export default function Hub({ initial, ...access }: { initial: BrandConfig } & HubAccess) {
  return (
    <HubProvider initial={initial} canEdit={Boolean(access.canEdit)} sandbox={Boolean(access.sandbox)}>
      <HubShell access={access} />
    </HubProvider>
  )
}

function HubShell({ access }: { access: HubAccess }) {
  const { config, active, setActive, editingSection, setEditingSection, cancelEditing } = useHub()
  // Which section a share link should be scoped to, or '' for the whole hub.
  const [shareSection, setShareSection] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  // Opening the importer straight from the welcome card put a dialog under the
  // same click that dismissed the card, and the click landed outside it, so it
  // closed again on the frame it appeared. It waits for the card to finish
  // leaving instead.
  const [importAfterWelcome, setImportAfterWelcome] = useState(false)
  // Set by the redirect that created this hub, and cleared as it opens so a
  // reload or a shared link never celebrates twice.
  const [welcome, setWelcome] = useState(false)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.has('new')) return
    setWelcome(true)
    window.history.replaceState({}, '', window.location.pathname)
  }, [])
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

  // ⌘K or ⌘Space opens search from anywhere in the hub. (macOS usually keeps
  // ⌘Space for Spotlight; when the browser does receive it, it works here too.)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'k' || e.code === 'Space')) {
        e.preventDefault()
        setSearchOpen(open => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Edit mode answers the keys people expect: Enter keeps the changes and
  // leaves, Escape leaves and puts everything back.
  useEffect(() => {
    if (!editingSection || searchOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.code === 'Escape') {
        cancelEditing()
        return
      }
      // Enter inside a textarea makes a newline, and a field that already
      // handled Enter (like the tag input) keeps its own behavior. Matched by
      // code as well as key, since some input paths send one without the other.
      const isEnter = e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter'
      if (isEnter && !e.defaultPrevented && !(e.target instanceof HTMLTextAreaElement)) {
        setEditingSection(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editingSection, searchOpen, cancelEditing, setEditingSection])

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
      case 'colors':     return <ColorsSection label={activeSection.label} />
      case 'typography': return <TypographySection label={activeSection.label} />
      case 'guidelines': return <GuidelinesSection label={activeSection.label} />
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
          access={access}
        />

        <SidebarInset className="flex flex-col min-w-0 min-h-0">
          {access.sandbox && <SandboxNotice />}
          {/* The trigger lives in a header rather than floating over the
              content, as upstream's sidebar blocks have it. It sits outside the
              rail, which is what lets it expand a collapsed one. `shrink-0`
              keeps it in place while `main` scrolls under it. */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            {/* The hub's own controls. Everything below this bar now acts on
                one section with quiet outline buttons, so this is the one place
                a solid button means something: adding files is what someone
                came here to do. The rest stay secondary — sharing the hub,
                and search, which editors used to reach only by knowing ⌘K
                existed because Add files had taken its slot. Edit lives with
                the section it acts on, in the section's own header. */}
            {access.canEdit || access.sandbox ? (
              <div className="ml-auto flex items-center gap-2">
                <Button size="icon-sm" variant="ghost" onClick={() => setSearchOpen(true)} title="Search (⌘K)" aria-label="Search">
                  <Icon name="search" size={14} />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShareSection('')}>
                  <Icon name="share" size={13} /> Share
                </Button>
                <Button size="sm" onClick={() => setImportOpen(true)}>
                  <Icon name="upload" size={13} /> Add files
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="ml-auto flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-[12.5px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="search" size={13} />
                <span>Search</span>
                <kbd className="text-[10px] font-medium border border-border rounded-md px-1.5 py-px">⌘K</kbd>
              </button>
            )}
          </header>
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
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} studio={Boolean(access.studio)} />}
      {searchOpen && <SearchOverlay onNavigate={setActive} onClose={() => setSearchOpen(false)} />}
      {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
      {welcome && (
        <WelcomeModal
          onClose={() => {
            setWelcome(false)
            if (importAfterWelcome) { setImportAfterWelcome(false); setImportOpen(true) }
          }}
          onAddFiles={() => setImportAfterWelcome(true)}
        />
      )}
    </div>
  )
}

/**
 * Says out loud that this is a sandbox.
 *
 * Without it, edits vanishing on reload reads as a bug rather than the point.
 *
 * It sits inside the inset rather than spanning the window. Stacked above the
 * provider it looked full width in the markup, but the sidebar is
 * `fixed inset-y-0`, so it pins itself to the top of the viewport and paints
 * over the notice's first half. The sentence then began mid-word.
 */
function SandboxNotice() {
  const [open, setOpen] = useState(true)
  if (!open) return null
  return (
    <div className="shrink-0 flex items-center gap-3 border-b border-border bg-muted px-4 sm:px-6 py-2 text-[12.5px]">
      <span className="text-muted-foreground shrink-0"><Icon name="sparkles" size={13} /></span>
      <span className="text-muted-foreground flex-1 min-w-0">
        Try anything here. This demo resets when you reload, so nothing you change is saved or shared.
      </span>
      <Link href="/login" className="font-semibold text-foreground whitespace-nowrap hover:opacity-70 transition-opacity">
        Start a free hub
      </Link>
      <button onClick={() => setOpen(false)} className="text-muted-foreground/60 hover:text-foreground shrink-0" title="Dismiss">
        <Icon name="close" size={12} />
      </button>
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
    <div className="t-toast is-open bg-primary text-primary-foreground px-4 sm:px-6 py-2.5 flex items-center gap-3 text-[13px]">
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
  dark, onToggleTheme, onShareSection, onSettings, access,
}: {
  dark: boolean
  onToggleTheme: () => void
  onShareSection: (sectionId: string) => void
  onSettings: () => void
  access: HubAccess
}) {
  const { config, active, setActive } = useHub()

  const kindLabel = access.demo ? 'Demo hub' : access.studio ? 'Studio hub' : 'Client space'

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
        <SpaceSwitcher currentSlug={config.slug} kindLabel={kindLabel} />
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onToggleTheme} tooltip={dark ? 'Light mode' : 'Dark mode'}>
              <IconSwap on={dark} a={<Icon name="moon" size={14} />} b={<Icon name="sun" size={14} />} />
              <TextSwap>{dark ? 'Light mode' : 'Dark mode'}</TextSwap>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {(access.isOwner || access.sandbox) && (
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
  section, index, active, onSelect, onShare, canEdit,
}: {
  section: SectionConfig
  index: number
  active: boolean
  onSelect: (id: string) => void
  onShare: (sectionId: string) => void
  canEdit: boolean
}) {
  const { editingSection, setEditingSection, update } = useHub()
  const { confirm, confirmDialog } = useConfirm()
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
      {confirmDialog}
      {isEditing ? (
        <SidebarMenuButton isActive={active} render={<div />} className="gap-1.5">
          <Icon name={section.icon} size={14} />
          <input
            value={section.label}
            autoFocus
            // The field must stop short of the row's two actions. `size={1}`
            // drops the input's intrinsic width so it can shrink at all, and the
            // clearance is a margin rather than padding on the button — the
            // component's own variants win that one, resolving pr-20 to 32px.
            size={1}
            onChange={e => update(c => { c.sections[index].label = e.target.value })}
            onKeyDown={e => e.key === 'Enter' && setEditingSection(null)}
            className="mr-7 w-0 min-w-0 flex-1 rounded-md bg-background px-1.5 py-0.5 text-foreground ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            className="right-7 md:translate-x-1 group-hover/menu-item:translate-x-0 transition-all"
            title={`Share ${section.label}`}
            onClick={() => onShare(section.id)}
          >
            <Icon name="share" size={11} />
          </SidebarMenuAction>
          <SidebarMenuAction
            showOnHover
            className="hover:!text-destructive md:translate-x-1 group-hover/menu-item:translate-x-0 transition-all"
            title={`Delete ${section.label}`}
            onClick={async () => {
              const ok = await confirm({
                title: `Delete the "${section.label}" section?`,
                description: 'Everything filed under it goes too.',
                confirmLabel: 'Delete section',
                destructive: true,
              })
              if (!ok) return
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
