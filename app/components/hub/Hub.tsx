'use client'

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

export interface HubAccess {
  canEdit?: boolean
  isOwner?: boolean
  demo?: boolean
  signedIn?: boolean
}

export default function Hub({ initial, previewId, ...access }: { initial: BrandConfig; previewId?: string } & HubAccess) {
  return (
    <HubProvider initial={initial}>
      <HubShell previewId={previewId} access={access} />
    </HubProvider>
  )
}

function HubShell({ previewId, access }: { previewId?: string; access: HubAccess }) {
  const { config, editing, setEditing, saveState } = useHub()
  const [active, setActive] = useState(config.sections[0]?.id || 'logo')
  const [shareOpen, setShareOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  // Dark-first, remembered per browser.
  const [dark, setDark] = useState(true)
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
      case 'colors':     return <ColorsSection />
      case 'typography': return <TypographySection />
      case 'guidelines': return <GuidelinesSection />
      default:           return <AssetsSection sectionId={activeSection.id} />
    }
  }

  return (
    <div className={`${dark ? 'hub-dark' : 'hub-light'} min-h-screen bg-[var(--hub-bg)] text-[var(--hub-text)] flex flex-col`}>
      {fontUrls.map(url => <link key={url} rel="stylesheet" href={url} />)}

      {previewId && <ClaimBanner previewId={previewId} />}
      <WelcomeToast />

      <div className="flex-1 flex">
        {/* Mobile nav backdrop */}
        {navOpen && <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setNavOpen(false)} />}

        <Sidebar
          active={activeSection?.id || ''}
          onSelect={id => { setActive(id); setNavOpen(false) }}
          open={navOpen}
          dark={dark}
          onToggleTheme={toggleTheme}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            onMenu={() => setNavOpen(o => !o)}
            onShare={() => setShareOpen(true)}
            onSettings={() => setSettingsOpen(true)}
            onNavigate={setActive}
            editing={editing}
            setEditing={setEditing}
            saveState={saveState}
            sectionLabel={activeSection?.label || ''}
            preview={Boolean(previewId)}
            access={access}
          />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>

      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} isOwner={Boolean(access.isOwner)} demo={Boolean(access.demo)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      <BrandAgent />
    </div>
  )
}

// ─── One-time toasts after claiming or receiving a hub ────────────────────────

function WelcomeToast() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('claimed')) setMessage('This hub is yours now. Hit Edit to make it perfect, then Share when you’re ready.')
    if (params.has('transferred')) setMessage('You now own this hub. The previous owner stays on as an editor.')
    if (params.has('claimed') || params.has('transferred')) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  if (!message) return null
  return (
    <div className="bg-emerald-600 text-white px-4 sm:px-6 py-2.5 flex items-center gap-3 text-[13px]">
      <span className="font-semibold shrink-0">🎉 Welcome!</span>
      <span className="text-white/90 flex-1">{message}</span>
      <button onClick={() => setMessage('')} className="text-white/70 hover:text-white shrink-0" title="Dismiss">
        <Icon name="close" size={12} />
      </button>
    </div>
  )
}

// ─── Claim banner (scan previews only) ────────────────────────────────────────

function ClaimBanner({ previewId }: { previewId: string }) {
  const { config } = useHub()
  const [state, setState] = useState<'idle' | 'claiming' | 'email' | 'sending' | 'sent'>('idle')
  const [email, setEmail] = useState('')
  const [devLink, setDevLink] = useState('')
  const [error, setError] = useState('')

  async function claim() {
    setState('claiming')
    setError('')
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewId }),
      })
      const data = await res.json()
      if (res.status === 401 && data.needAuth) {
        setState('email') // not signed in — ask for their email
        return
      }
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      window.location.href = `/${data.slug}`
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setState('idle')
    }
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setState('sending')
    setError('')
    try {
      const res = await fetch('/api/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), previewId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setDevLink(data.devLink || '')
      setState('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('email')
    }
  }

  return (
    <div className="bg-[var(--hub-btn)] text-[var(--hub-btn-text)] px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap sticky top-0 z-50">
      {state === 'sent' ? (
        <p className="text-[13px] leading-snug flex-1 min-w-[200px]">
          <span className="font-semibold">Check your email</span>
          <span className="text-white/70"> — your claim link is on its way to {email}.</span>
          {devLink && (
            <>
              {' '}
              <a href={devLink} className="underline underline-offset-2 font-semibold">
                Or open your claim link directly →
              </a>
            </>
          )}
        </p>
      ) : state === 'email' || state === 'sending' ? (
        <form onSubmit={sendLink} className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
          <p className="text-[13px] text-white/70">Where should this hub live?</p>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            autoFocus
            className="flex-1 min-w-[180px] text-[13px] px-3 py-2 rounded-lg bg-[var(--hub-panel)]/10 border border-white/20 outline-none focus:border-white placeholder:text-white/40"
          />
          <button
            type="submit"
            disabled={state === 'sending'}
            className="text-[13px] font-semibold bg-[var(--hub-panel)] text-[var(--hub-text)] px-4 py-2 rounded-lg hover:bg-[var(--hub-panel)]/90 transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {state === 'sending' ? 'Sending…' : 'Claim it'}
          </button>
          {error && <span className="text-[12px] text-red-300 w-full">{error}</span>}
        </form>
      ) : (
        <>
          <p className="text-[13px] leading-snug flex-1 min-w-[200px]">
            <span className="font-semibold">This is {config.name}&rsquo;s brand hub</span>
            <span className="text-white/70"> — built from your website. Claim it to keep and edit it. Unclaimed previews expire in 24 hours.</span>
            {error && <span className="text-red-300"> {error}</span>}
          </p>
          <button
            onClick={claim}
            disabled={state === 'claiming'}
            className="text-[13px] font-semibold bg-[var(--hub-panel)] text-[var(--hub-text)] px-4 py-2 rounded-lg hover:bg-[var(--hub-panel)]/90 transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {state === 'claiming' ? 'Claiming…' : 'Claim this hub — free'}
          </button>
        </>
      )}
    </div>
  )
}

// ─── Top bar ──────────────────────────────────────────────────────────────────

function TopBar({
  onMenu, onShare, onSettings, onNavigate, editing, setEditing, saveState, sectionLabel, preview, access,
}: {
  onMenu: () => void
  onShare: () => void
  onSettings: () => void
  onNavigate: (sectionId: string) => void
  editing: boolean
  setEditing: (v: boolean) => void
  saveState: 'idle' | 'saving' | 'saved' | 'error'
  sectionLabel: string
  preview: boolean
  access: HubAccess
}) {
  return (
    <header className="h-14 shrink-0 bg-[var(--hub-panel)] border-b border-[var(--hub-border)] flex items-center gap-3 px-4 sm:px-6 sticky top-0 z-20">
      <button onClick={onMenu} className="md:hidden text-[var(--hub-muted)] hover:text-[var(--hub-text)] transition-colors" title="Menu">
        <Icon name="menu" size={18} />
      </button>
      <p className="text-[13px] font-medium text-[var(--hub-muted)] truncate">{sectionLabel}</p>
      <SearchBox onNavigate={onNavigate} />

      {preview ? (
        <div className="ml-auto">
          <span className="text-[12px] font-medium text-[var(--hub-faint)]">Preview — claim to edit and share</span>
        </div>
      ) : (
      <div className="ml-auto flex items-center gap-2.5">
        {editing && (
          <span className={`text-[12px] font-medium hidden sm:flex items-center gap-1.5 ${
            saveState === 'error' ? 'text-red-500' : 'text-[var(--hub-muted)]'
          }`}>
            {saveState === 'saving' && (
              <><span className="w-1.5 h-1.5 rounded-full bg-[#b0afa9] animate-pulse" /> Saving…</>
            )}
            {(saveState === 'saved' || saveState === 'idle') && (
              <><Icon name="check" size={11} /> {saveState === 'saved' ? 'Saved' : 'All changes saved'}</>
            )}
            {saveState === 'error' && 'Couldn’t save — retrying on next edit'}
          </span>
        )}

        {access.demo && access.canEdit && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--hub-muted)] bg-[var(--hub-soft)] px-2 py-1 rounded-md hidden sm:block">
            Demo — anyone can edit
          </span>
        )}

        <button
          onClick={onShare}
          className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--hub-text)] border border-[var(--hub-border)] hover:border-[var(--hub-text)] rounded-lg px-3 py-1.5 transition-colors"
        >
          <Icon name="share" size={13} /> Share
        </button>

        {access.isOwner && (
          <button
            onClick={onSettings}
            className="flex items-center text-[var(--hub-muted)] hover:text-[var(--hub-text)] border border-[var(--hub-border)] hover:border-[var(--hub-text)] rounded-lg px-2 py-1.5 transition-colors"
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
                ? 'bg-[var(--hub-btn)] text-[var(--hub-btn-text)] hover:opacity-85'
                : 'border border-[var(--hub-border)] text-[var(--hub-text)] hover:border-[var(--hub-text)]'
            }`}
          >
            {editing ? <><Icon name="check" size={13} /> Done</> : <><Icon name="edit" size={13} /> Edit</>}
          </button>
        ) : !access.signedIn ? (
          <a
            href="/login"
            className="text-[13px] font-medium text-[var(--hub-faint)] hover:text-[var(--hub-text)] transition-colors"
          >
            Sign in
          </a>
        ) : null}
      </div>
      )}
    </header>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const SECTION_ICONS: Record<string, SectionConfig['icon']> = {
  assets: 'screenshots',
  guidelines: 'guidelines',
}

function Sidebar({ active, onSelect, open, dark, onToggleTheme }: { active: string; onSelect: (id: string) => void; open: boolean; dark: boolean; onToggleTheme: () => void }) {
  const { config, editing, update } = useHub()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [logoUploading, setLogoUploading] = useState(false)

  async function uploadLogo(file: File) {
    setLogoUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('slug', config.slug)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      update(c => { c.logoUrl = data.url })
    } catch {
      // Leave the current logo in place on failure.
    } finally {
      setLogoUploading(false)
    }
  }

  function addSection() {
    update(c => {
      let n = c.sections.length + 1
      let id = `section-${n}`
      while (c.sections.some(s => s.id === id)) id = `section-${++n}`
      c.sections.push({ id, label: 'New section', type: 'assets', icon: SECTION_ICONS.assets })
      c.assets[id] = []
    })
  }

  return (
    <aside className={`w-60 shrink-0 border-r border-[var(--hub-border)] bg-[var(--hub-panel)] flex flex-col h-screen z-40 transition-transform
      fixed inset-y-0 left-0 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:sticky md:top-0`}>
      {/* Identity */}
      <div className="px-4 py-4 border-b border-[var(--hub-border)]">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => editing && logoInputRef.current?.click()}
            className={`w-9 h-9 shrink-0 rounded-lg overflow-hidden flex items-center justify-center ${
              editing ? 'cursor-pointer ring-1 ring-dashed ring-[#d6d4cd] hover:ring-[#1a1a1a]' : ''
            } ${logoUploading ? 'animate-pulse' : ''}`}
            title={editing ? 'Change logo' : undefined}
            disabled={!editing}
          >
            {config.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.logoUrl} alt={config.name} className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ) : (
              <div className="w-full h-full bg-[#1a1a1a] rounded-lg" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-tight truncate">
              <Editable value={config.name} placeholder="Brand name" onChange={v => update(c => { c.name = v })} />
            </p>
            <p className="text-[10px] text-[var(--hub-faint)] leading-tight mt-0.5">
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

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--hub-faint)] px-2 mb-2">Sections</p>
        {config.sections.map((section, i) => (
          <SidebarItem
            key={section.id}
            section={section}
            index={i}
            count={config.sections.length}
            active={active === section.id}
            onSelect={onSelect}
          />
        ))}
        {editing && (
          <button
            onClick={addSection}
            className="w-full flex items-center gap-2.5 px-2 py-1.5 mt-1 rounded-lg text-[13px] text-[var(--hub-faint)] hover:text-[var(--hub-text)] border border-dashed border-transparent hover:border-[var(--hub-border)] transition-colors"
          >
            <Icon name="plus" size={13} /> Add section
          </button>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--hub-border)]">
        <a href="/" className="text-[11px] text-[var(--hub-faint)] hover:text-[var(--hub-text)] transition-colors">
          Made with Brand Portal
        </a>
        <button
          onClick={onToggleTheme}
          className="mt-2 w-full flex items-center gap-2 text-[12px] text-[var(--hub-muted)] hover:text-[var(--hub-text)] transition-colors"
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
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[13px] text-[var(--hub-muted)] hover:text-[var(--hub-text)] hover:bg-[var(--hub-soft)] transition-colors"
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
          active ? 'bg-[var(--hub-soft)] text-[var(--hub-text)] font-medium' : 'text-[var(--hub-muted)] hover:text-[var(--hub-text)] hover:bg-[var(--hub-soft)]'
        }`}
      >
        <Icon name={section.icon} size={14} />
        {section.label}
      </button>
    )
  }

  // Edit mode: label is editable, with reorder/delete controls on hover.
  return (
    <div className={`group flex items-center gap-1.5 px-2 py-1 rounded-lg ${active ? 'bg-[var(--hub-soft)]' : 'hover:bg-[var(--hub-soft)]'}`}>
      <button onClick={() => onSelect(section.id)} className="text-[var(--hub-muted)]" title="Open section">
        <Icon name={section.icon} size={14} />
      </button>
      <input
        value={section.label}
        onChange={e => update(c => { c.sections[index].label = e.target.value })}
        onFocus={() => onSelect(section.id)}
        className="flex-1 min-w-0 text-[13px] bg-transparent outline-none border border-dashed border-transparent hover:border-[var(--hub-border)] focus:border-[var(--hub-text)] rounded px-1 text-[var(--hub-text)]"
      />
      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => index > 0 && update(c => {
            const [s] = c.sections.splice(index, 1)
            c.sections.splice(index - 1, 0, s)
          })}
          disabled={index === 0}
          className="text-[var(--hub-faint)] hover:text-[var(--hub-text)] disabled:opacity-30 p-0.5"
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
          className="text-[var(--hub-faint)] hover:text-[var(--hub-text)] disabled:opacity-30 p-0.5"
          title="Move down"
        >
          <Icon name="down" size={11} />
        </button>
        <button
          onClick={() => {
            if (!window.confirm(`Delete the "${section.label}" section?`)) return
            update(c => { c.sections.splice(index, 1) })
          }}
          className="text-[var(--hub-faint)] hover:text-red-500 p-0.5"
          title="Delete section"
        >
          <Icon name="trash" size={11} />
        </button>
      </div>
    </div>
  )
}
