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
  const [navOpen, setNavOpen] = useState(false)
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

      <div className="flex-1 flex min-h-0">
        {/* Mobile nav backdrop */}
        {navOpen && <div className="fixed inset-0 bg-foreground/20 z-30 md:hidden" onClick={() => setNavOpen(false)} />}

        <Sidebar
          active={activeSection?.id || ''}
          onSelect={id => { setActive(id); setNavOpen(false) }}
          open={navOpen}
          dark={dark}
          onToggleTheme={toggleTheme}
        />

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <TopBar
            onMenu={() => setNavOpen(o => !o)}
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
        </div>
      </div>

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
  onMenu, onShare, onSettings, onNavigate, editing, setEditing, saveState, sectionLabel, access,
}: {
  onMenu: () => void
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
      <button onClick={onMenu} className="md:hidden text-muted-foreground hover:text-foreground transition-colors" title="Menu">
        <Icon name="menu" size={18} />
      </button>
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

function Sidebar({ active, onSelect, open, dark, onToggleTheme }: { active: string; onSelect: (id: string) => void; open: boolean; dark: boolean; onToggleTheme: () => void }) {
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

  return (
    <aside className={`w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col h-screen z-40 transition-transform
      fixed inset-y-0 left-0 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:sticky md:top-0`}>
      {/* Identity */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
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
          <div className="min-w-0 flex-1">
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
      </div>

      {/* Nav — grouped like a real brand hub: Assets / Tools / Resources */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {([['main', ''], ['assets', 'Assets'], ['subbrands', 'Sub Brands'], ['tools', 'Tools'], ['resources', 'Resources']] as const).map(([groupKey, groupLabel]) => {
          const items = config.sections
            .map((section, i) => ({ section, i }))
            .filter(({ section }) => (section.group || 'assets') === groupKey)
          if (items.length === 0) return null
          return (
            <div key={groupKey} className="mb-4">
              {groupLabel && <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-2 mb-2">{groupLabel}</p>}
              {items.map(({ section, i }) => (
                <SidebarItem
                  key={section.id}
                  section={section}
                  index={i}
                  count={config.sections.length}
                  active={active === section.id}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )
        })}
        <div className="hidden">
        </div>

      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {editing && (
          <div className="mb-3 flex justify-center">
            {/* The plus splits into the section kinds — it used to always make an
                assets section, so choosing one was a rename away. It lives down
                here rather than under the section list because the fan opens
                upward and the nav above scrolls, which clipped the satellites. */}
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
        <div className="mb-3">
          <SpaceSwitcher currentSlug={config.slug} currentName={config.name} />
        </div>
        <Link href="/" className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors">
          Made with Pitho
        </Link>
        <button
          onClick={onToggleTheme}
          className="mt-2 w-full flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon name={dark ? 'sun' : 'moon'} size={13} /> {dark ? 'Light mode' : 'Dark mode'}
        </button>
        <a className="hidden">
        </a>
      </div>
    </aside>
  )
}

function SidebarItem({
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
      <a
        href={section.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Icon name={section.icon} size={14} />
        {section.label}
        <Icon name="link" size={11} />
      </a>
    )
  }

  if (!editing) {
    return (
      <button
        onClick={() => onSelect(section.id)}
        className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[13px] transition-colors text-left ${
          active ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
      >
        <Icon name={section.icon} size={14} />
        {section.label}
      </button>
    )
  }

  // Edit mode: label is editable, with reorder/delete controls on hover.
  return (
    <div className={`group flex items-center gap-1.5 px-2 py-1 rounded-lg ${active ? 'bg-muted' : 'hover:bg-muted'}`}>
      <button onClick={() => onSelect(section.id)} className="text-muted-foreground" title="Open section">
        <Icon name={section.icon} size={14} />
      </button>
      <input
        value={section.label}
        onChange={e => update(c => { c.sections[index].label = e.target.value })}
        onFocus={() => onSelect(section.id)}
        className="flex-1 min-w-0 text-[13px] bg-transparent outline-none border border-dashed border-transparent hover:border-border focus:border-ring rounded px-1 text-foreground"
      />
      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => index > 0 && update(c => {
            const [s] = c.sections.splice(index, 1)
            c.sections.splice(index - 1, 0, s)
          })}
          disabled={index === 0}
          className="text-muted-foreground/60 hover:text-foreground disabled:opacity-30 p-0.5"
          title="Move up"
        >
          <Icon name="up" size={11} />
        </button>
        <button
          onClick={() => index < count - 1 && update(c => {
            const [s] = c.sections.splice(index, 1)
            c.sections.splice(index + 1, 0, s)
          })}
          disabled={index === count - 1}
          className="text-muted-foreground/60 hover:text-foreground disabled:opacity-30 p-0.5"
          title="Move down"
        >
          <Icon name="down" size={11} />
        </button>
        <button
          onClick={() => {
            if (!window.confirm(`Delete the "${section.label}" section?`)) return
            update(c => { c.sections.splice(index, 1) })
          }}
          className="text-muted-foreground/60 hover:text-destructive p-0.5"
          title="Delete section"
        >
          <Icon name="trash" size={11} />
        </button>
      </div>
    </div>
  )
}
