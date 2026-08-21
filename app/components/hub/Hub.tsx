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
import { DocSection } from './DocSection'

/**
 * What each prose section is for, shown while it is still empty. A blank page
 * under a heading tells nobody what to put on it.
 */
const DOC_PROMPTS: Record<string, string> = {
  'brand-story': 'Where the brand came from, who it is for, and what it is trying to change.',
  'brand-personality': 'The handful of traits the brand acts on — and the ones it deliberately is not.',
  'visual-identity': 'How the parts fit together: the mark, the palette, the type, and the feel they add up to.',
  'brand-voice': 'How the brand sounds when it writes. Tone, rhythm, the words it reaches for and avoids.',
  'photography': 'What a photograph has to do to belong to this brand — subject, light, colour, crop.',
}
import { ShareModal } from './ShareModal'
import { SettingsModal } from './SettingsModal'
import { HomeSection } from './HomeSection'
import { SpaceSwitcher } from './SpaceSwitcher'
import { SearchOverlay } from './SearchOverlay'
import { ImportModal } from './ImportModal'
import { WelcomeModal } from './WelcomeModal'
import { SandboxKeepBar } from './SandboxKeepBar'
import { useConfirm } from './useConfirm'
import { customFontFaceCss } from './font-files'
import { Button } from '@/components/ui/button'
import { IconSwap, TextSwap } from '../transitions'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuAction,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  /** The signed-in account's email, for the sidebar's account menu. */
  email?: string
  /** The account's own hub, as opposed to a client space. */
  studio?: boolean
  /**
   * The demo: edit controls work, but every change stays in this browser and
   * is gone on reload, so no visitor inherits the last one's mess.
   */
  sandbox?: boolean
}

export default function Hub({
  initial,
  openSection,
  ...access
}: { initial: BrandConfig; openSection?: string } & HubAccess) {
  return (
    <HubProvider
      initial={initial}
      openSection={openSection}
      canEdit={Boolean(access.canEdit)}
      sandbox={Boolean(access.sandbox)}
    >
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

  /**
   * The theme class also goes on <html>, not only on the wrapper below.
   *
   * Every dialog portals to document.body, which sits outside that wrapper —
   * so in dark mode the hub went dark and each modal opened white, palette
   * included. The class has to be somewhere both trees can see.
   */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    return () => document.documentElement.classList.remove('dark')
  }, [dark])

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

  // Uploaded font files have no Google stylesheet; their faces are declared
  // here, so a dropped Onest-SemiBold.woff2 actually renders as Onest.
  const customFaces = useMemo(() => customFontFaceCss(config), [config])

  function renderContent() {
    if (!activeSection) return null
    switch (activeSection.type) {
      case 'home':       return <HomeSection />
      case 'colors':     return <ColorsSection label={activeSection.label} />
      case 'typography': return <TypographySection label={activeSection.label} />
      case 'guidelines': return <GuidelinesSection label={activeSection.label} />
      case 'doc':        return (
        <DocSection
          sectionId={activeSection.id}
          label={activeSection.label}
          placeholder={DOC_PROMPTS[activeSection.id] || 'Write this part of the brand.'}
        />
      )
      case 'subbrand':   return <SubBrandPlaceholder label={activeSection.label} />
      default:           return <AssetsSection sectionId={activeSection.id} />
    }
  }

  return (
    <div className={`${dark ? 'dark' : ''} h-screen overflow-hidden bg-background text-foreground flex flex-col`}>
      {fontUrls.map(url => <link key={url} rel="stylesheet" href={url} />)}
      {customFaces && <style dangerouslySetInnerHTML={{ __html: customFaces }} />}

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
          {/* The trigger lives in a header rather than floating over the
              content, as upstream's sidebar blocks have it. It sits outside the
              rail, which is what lets it expand a collapsed one. `shrink-0`
              keeps it in place while `main` scrolls under it. */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            {/* Whose hub this is. The sidebar says so on desktop, but on a
                phone it's behind the drawer, so a client opening a share link
                had nothing on screen naming the brand they were looking at.
                `md:hidden` keeps the desktop bar exactly as it was. */}
            <div className="flex min-w-0 items-center gap-2 md:hidden">
              {config.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.logoUrl} alt="" className="h-6 w-auto max-w-[92px] object-contain" />
              ) : (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
                  {config.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="truncate text-[13px] font-medium">{config.name}</span>
            </div>
            {/* The hub's own controls. Everything below this bar now acts on
                one section with quiet outline buttons, so this is the one place
                a solid button means something: adding files is what someone
                came here to do. The rest stay secondary — sharing the hub,
                and search, which editors used to reach only by knowing ⌘K
                existed because Add files had taken its slot. Edit lives with
                the section it acts on, in the section's own header. */}
            {access.canEdit || access.sandbox ? (
              <div className="ml-auto flex items-center gap-2">
                {/* Medium, not small: this bar is 64px tall and the buttons in
                    it were the same height as the ones tucked beside a section
                    heading, so the hub's own controls read as an afterthought
                    in a lot of empty space. */}
                <Button size="icon" variant="ghost" onClick={() => setSearchOpen(true)} title="Search (⌘K)" aria-label="Search">
                  <Icon name="search" size={15} />
                </Button>
                <Button variant="outline" onClick={() => setShareSection('')}>
                  <Icon name="share" size={14} /> Share
                </Button>
                <Button onClick={() => setImportOpen(true)}>
                  <Icon name="upload" size={14} /> Add files
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
            {/* The full pane, at the bar's own margins — the header buttons
                are the marker, so the content runs edge to edge with the same
                px-4 they sit inside, not a centred column with a width cap. */}
            <div className="px-4 py-8">
              {renderContent()}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>

      {shareSection !== null && (
        <ShareModal
          section={shareSection || undefined}
          onClose={() => setShareSection(null)}
          canEdit={Boolean(access.canEdit)}
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

      {/* Renders itself only once a sandbox visitor has changed something. */}
      <SandboxKeepBar />
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
/** The logout route is a POST, so it needs a form rather than a link. */
function signOut() {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = '/api/auth/logout'
  document.body.appendChild(form)
  form.submit()
}

function HubSidebar({
  dark, onToggleTheme, onShareSection, onSettings, access,
}: {
  dark: boolean
  onToggleTheme: () => void
  onShareSection: (sectionId: string) => void
  onSettings: () => void
  access: HubAccess
}) {
  const { config, active, setActive, update, setEditingSection } = useHub()

  // One vocabulary everywhere: the account's own hub is the main account, the
  // rest are client spaces. The demo said one thing and a real account another
  // for the same idea.
  const kindLabel = access.demo ? 'Demo hub' : access.studio ? 'Main account' : 'Client space'

  /**
   * A new section, named where you'll be looking.
   *
   * It lands selected and with its label in edit, because "New section" is
   * never what anyone wanted it called — the rename is the second half of the
   * same gesture, not a thing to go hunting for afterwards.
   */
  function addSection(group: 'assets' | 'resources') {
    const taken = new Set(config.sections.map(s => s.id))
    let id = 'section'
    for (let n = 2; taken.has(id); n++) id = `section-${n}`
    update(c => {
      c.sections.push({ id, label: 'New section', type: 'assets', icon: 'file', group })
      if (!c.assets[id]) c.assets[id] = []
    })
    setActive(id)
    setEditingSection(id)
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
        <SpaceSwitcher currentSlug={config.slug} kindLabel={kindLabel} />
      </SidebarHeader>

      <SidebarContent>
        {GROUPS.map(([groupKey, groupLabel]) => {
          const items = config.sections
            .map((section, i) => ({ section, i }))
            .filter(({ section }) => (section.group || 'assets') === groupKey)
          // Sub-brands and tools are wired to their own things; a bare section
          // dropped into them would have nothing to do.
          const canAdd = access.canEdit && (groupKey === 'assets' || groupKey === 'resources')
          if (items.length === 0 && !canAdd) return null
          return (
            <SidebarGroup key={groupKey}>
              {groupLabel && <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>}
              {/* Adding a section had no door of its own — the only way to get
                  one was to drop a folder the importer couldn't place. */}
              {canAdd && groupLabel && (
                <SidebarGroupAction
                  title={`Add a section to ${groupLabel}`}
                  onClick={() => addSection(groupKey)}
                  className="[&>svg]:size-3"
                >
                  <Icon name="plus" size={12} />
                  <span className="sr-only">Add a section to {groupLabel}</span>
                </SidebarGroupAction>
              )}
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
          {/* The account, reachable from where people actually are.
              Account settings and Sign out used to be linked from one place —
              the dashboard's avatar menu — and the dashboard redirects into
              your hub when it's the only one you own. So an owner with a single
              hub could not sign out, change their email, or delete their
              account without knowing a URL. */}
          {access.signedIn && (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton tooltip={access.email || 'Account'}>
                      <Icon name="person" size={14} />
                      <span className="truncate">{access.email || 'Account'}</span>
                    </SidebarMenuButton>
                  }
                />
                <DropdownMenuContent side="top" align="start" className="w-56">
                  {access.email && (
                    <>
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                          {access.email}
                        </DropdownMenuLabel>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuGroup>
                    <DropdownMenuItem render={<Link href="/dashboard?all=1" />}>
                      <Icon name="spaces" size={14} /> Your hubs
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href="/settings" />}>
                      <Icon name="gear" size={14} /> Account settings
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={signOut}>
                      <Icon name="link" size={14} /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
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
  const { isMobile, setOpenMobile } = useSidebar()
  const isEditing = editingSection === section.id

  /**
   * On a phone the sidebar is a sheet covering the whole screen, so choosing a
   * section used to change what was underneath and leave the sheet sitting on
   * top of it. Nothing appeared to happen, and getting to the thing you asked
   * for meant knowing to dismiss the sheet yourself. On a pointer the sidebar
   * is beside the content and there is nothing to close.
   */
  function select(id: string) {
    onSelect(id)
    if (isMobile) setOpenMobile(false)
  }

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
            // Clicking away commits too. Enter is the documented way out, but
            // a name typed and then abandoned is a name someone meant to keep.
            onBlur={() => setEditingSection(null)}
            className="mr-7 w-0 min-w-0 flex-1 rounded-md bg-background px-1.5 py-0.5 text-foreground ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton isActive={active} onClick={() => select(section.id)} tooltip={section.label}>
          <Icon name={section.icon} size={14} />
          <span>{section.label}</span>
        </SidebarMenuButton>
      )}

      {/* Each section carries its own actions, revealed on hover — there is no
          top bar, and an action that belongs to one section shouldn't live in
          chrome shared by all of them.

          Hover is a pointer idea, so on touch those same two icons sat visible
          beside every row, putting a delete a thumb-width from every section
          name. Below md they collapse into the menu underneath; `md:contents`
          makes this wrapper vanish from layout above it, so the desktop rows
          are laid out exactly as before. */}
      {canEdit && (
        <span className="hidden md:contents">
          <SidebarMenuAction
            showOnHover
            className="right-7 md:translate-x-1 group-hover/menu-item:translate-x-0 transition-all [&>svg]:size-3"
            title={`Share ${section.label}`}
            onClick={() => onShare(section.id)}
          >
            <Icon name="share" size={11} />
          </SidebarMenuAction>
          <SidebarMenuAction
            showOnHover
            className="hover:!text-destructive md:translate-x-1 group-hover/menu-item:translate-x-0 transition-all [&>svg]:size-3"
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
        </span>
      )}

      {/* Touch gets one target instead of two, and the destructive one has to
          be asked for. */}
      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuAction className="md:hidden [&>svg]:size-3.5" title={`Actions for ${section.label}`}>
                <Icon name="more" size={14} />
              </SidebarMenuAction>
            }
          />
          <DropdownMenuContent align="end" side="bottom" className="min-w-40">
            <DropdownMenuItem onClick={() => onShare(section.id)}>
              <Icon name="share" size={13} /> Share section
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
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
              <Icon name="trash" size={13} /> Delete section
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </SidebarMenuItem>
  )
}
