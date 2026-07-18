'use client'

import { useMemo, useRef, useState } from 'react'
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

export default function Hub({ initial }: { initial: BrandConfig }) {
  return (
    <HubProvider initial={initial}>
      <HubShell />
    </HubProvider>
  )
}

function HubShell() {
  const { config, editing, setEditing, saveState } = useHub()
  const [active, setActive] = useState(config.sections[0]?.id || 'logo')
  const [shareOpen, setShareOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

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
    <div className="min-h-screen bg-[#f9f9f8] flex">
      {fontUrls.map(url => <link key={url} rel="stylesheet" href={url} />)}

      {/* Mobile nav backdrop */}
      {navOpen && <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setNavOpen(false)} />}

      <Sidebar
        active={activeSection?.id || ''}
        onSelect={id => { setActive(id); setNavOpen(false) }}
        open={navOpen}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          onMenu={() => setNavOpen(o => !o)}
          onShare={() => setShareOpen(true)}
          editing={editing}
          setEditing={setEditing}
          saveState={saveState}
          sectionLabel={activeSection?.label || ''}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8">
            {renderContent()}
          </div>
        </main>
      </div>

      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}
      <BrandAgent />
    </div>
  )
}

// ─── Top bar ──────────────────────────────────────────────────────────────────

function TopBar({
  onMenu, onShare, editing, setEditing, saveState, sectionLabel,
}: {
  onMenu: () => void
  onShare: () => void
  editing: boolean
  setEditing: (v: boolean) => void
  saveState: 'idle' | 'saving' | 'saved' | 'error'
  sectionLabel: string
}) {
  return (
    <header className="h-14 shrink-0 bg-white border-b border-[#e8e7e4] flex items-center gap-3 px-4 sm:px-6 sticky top-0 z-20">
      <button onClick={onMenu} className="md:hidden text-[#8a8a85] hover:text-[#1a1a1a] transition-colors" title="Menu">
        <Icon name="menu" size={18} />
      </button>
      <p className="text-[13px] font-medium text-[#8a8a85] truncate">{sectionLabel}</p>

      <div className="ml-auto flex items-center gap-2.5">
        {editing && (
          <span className={`text-[12px] font-medium hidden sm:flex items-center gap-1.5 ${
            saveState === 'error' ? 'text-red-500' : 'text-[#8a8a85]'
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

        <button
          onClick={onShare}
          className="flex items-center gap-1.5 text-[13px] font-medium text-[#1a1a1a] border border-[#e8e7e4] hover:border-[#1a1a1a] rounded-lg px-3 py-1.5 transition-colors"
        >
          <Icon name="share" size={13} /> Share
        </button>

        <button
          onClick={() => setEditing(!editing)}
          className={`flex items-center gap-1.5 text-[13px] font-semibold rounded-lg px-3.5 py-1.5 transition-colors ${
            editing
              ? 'bg-[#1a1a1a] text-white hover:bg-[#333]'
              : 'border border-[#e8e7e4] text-[#1a1a1a] hover:border-[#1a1a1a]'
          }`}
        >
          {editing ? <><Icon name="check" size={13} /> Done</> : <><Icon name="edit" size={13} /> Edit</>}
        </button>
      </div>
    </header>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const SECTION_ICONS: Record<string, SectionConfig['icon']> = {
  assets: 'screenshots',
  guidelines: 'guidelines',
}

function Sidebar({ active, onSelect, open }: { active: string; onSelect: (id: string) => void; open: boolean }) {
  const { config, editing, update } = useHub()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [logoUploading, setLogoUploading] = useState(false)

  async function uploadLogo(file: File) {
    setLogoUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
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
    <aside className={`w-60 shrink-0 border-r border-[#e8e7e4] bg-white flex flex-col h-screen z-40 transition-transform
      fixed inset-y-0 left-0 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:sticky md:top-0`}>
      {/* Identity */}
      <div className="px-4 py-4 border-b border-[#e8e7e4]">
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
            <p className="text-[10px] text-[#b0afa9] leading-tight mt-0.5">
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
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b0afa9] px-2 mb-2">Sections</p>
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
            className="w-full flex items-center gap-2.5 px-2 py-1.5 mt-1 rounded-lg text-[13px] text-[#b0afa9] hover:text-[#1a1a1a] border border-dashed border-transparent hover:border-[#dddcd6] transition-colors"
          >
            <Icon name="plus" size={13} /> Add section
          </button>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#e8e7e4]">
        <a href="/" className="text-[11px] text-[#b0afa9] hover:text-[#1a1a1a] transition-colors">
          Made with Brand Portal
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
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[13px] text-[#8a8a85] hover:text-[#1a1a1a] hover:bg-[#f5f5f3] transition-colors"
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
          active ? 'bg-[#f0efec] text-[#1a1a1a] font-medium' : 'text-[#8a8a85] hover:text-[#1a1a1a] hover:bg-[#f5f5f3]'
        }`}
      >
        <Icon name={section.icon} size={14} />
        {section.label}
      </button>
    )
  }

  // Edit mode: label is editable, with reorder/delete controls on hover.
  return (
    <div className={`group flex items-center gap-1.5 px-2 py-1 rounded-lg ${active ? 'bg-[#f0efec]' : 'hover:bg-[#f5f5f3]'}`}>
      <button onClick={() => onSelect(section.id)} className="text-[#8a8a85]" title="Open section">
        <Icon name={section.icon} size={14} />
      </button>
      <input
        value={section.label}
        onChange={e => update(c => { c.sections[index].label = e.target.value })}
        onFocus={() => onSelect(section.id)}
        className="flex-1 min-w-0 text-[13px] bg-transparent outline-none border border-dashed border-transparent hover:border-[#d6d4cd] focus:border-[#1a1a1a] rounded px-1 text-[#1a1a1a]"
      />
      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => index > 0 && update(c => {
            const [s] = c.sections.splice(index, 1)
            c.sections.splice(index - 1, 0, s)
          })}
          disabled={index === 0}
          className="text-[#b0afa9] hover:text-[#1a1a1a] disabled:opacity-30 p-0.5"
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
          className="text-[#b0afa9] hover:text-[#1a1a1a] disabled:opacity-30 p-0.5"
          title="Move down"
        >
          <Icon name="down" size={11} />
        </button>
        <button
          onClick={() => {
            if (!window.confirm(`Delete the "${section.label}" section?`)) return
            update(c => { c.sections.splice(index, 1) })
          }}
          className="text-[#b0afa9] hover:text-red-500 p-0.5"
          title="Delete section"
        >
          <Icon name="trash" size={11} />
        </button>
      </div>
    </div>
  )
}
