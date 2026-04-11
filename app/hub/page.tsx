'use client'

import { useState, useRef } from 'react'
import config from '../../brand.config'
import type { SectionConfig } from '../types/brand'

// ─── Icons ────────────────────────────────────────────────────────────────────

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const s = size
  switch (name) {
    case 'logo':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor"/><rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor" opacity=".4"/><rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor" opacity=".4"/><rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor"/></svg>
    case 'colors':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 2C8 2 12 5 12 8C12 11 8 14 8 14" fill="currentColor" opacity=".3"/></svg>
    case 'type':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M2 4h12M8 4v9M5 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    case 'screenshots':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M1 6h14" stroke="currentColor" strokeWidth="1"/></svg>
    case 'guidelines':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M3 4h10M3 8h7M3 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    case 'link':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M6 10L10 6M7 4h5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'download':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'copy':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M3 11V3h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    case 'chat':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M2 3h12v8H9l-3 2v-2H2V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
    case 'send':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M13 3L2 7l4.5 1.5L13 3zM13 3L8.5 13 6.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'close':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    default:
      return null
  }
}

// ─── Color Section ────────────────────────────────────────────────────────────

function ColorsSection() {
  const [copied, setCopied] = useState<string | null>(null)

  function copyHex(hex: string) {
    navigator.clipboard.writeText(hex)
    setCopied(hex)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold tracking-tight mb-1">Colors</h1>
      <p className="text-[14px] text-[#8a8a85] mb-8">Our colour palette — click any swatch to copy the hex value.</p>
      {config.colors.map(group => (
        <div key={group.group} className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#b0afa9] mb-4">{group.group}</p>
          <div className="flex flex-wrap gap-4">
            {group.swatches.map(swatch => (
              <button
                key={swatch.hex}
                onClick={() => copyHex(swatch.hex)}
                className="group flex flex-col items-start gap-2 w-[120px]"
              >
                <div
                  className="w-full h-20 rounded-xl border border-black/10 transition-transform group-hover:scale-105"
                  style={{ background: swatch.hex }}
                />
                <div className="text-left w-full">
                  <p className="text-[13px] font-medium text-[#1a1a1a]">{swatch.name}</p>
                  <p className="text-[12px] font-mono text-[#8a8a85] group-hover:text-[#1a1a1a] transition-colors">
                    {copied === swatch.hex ? 'Copied!' : swatch.hex}
                  </p>
                  {swatch.usage && <p className="text-[11px] text-[#b0afa9] mt-0.5 leading-tight">{swatch.usage}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Typography Section ───────────────────────────────────────────────────────

function TypographySection() {
  return (
    <div>
      <h1 className="text-[22px] font-bold tracking-tight mb-1">Typography</h1>
      <p className="text-[14px] text-[#8a8a85] mb-8">Our type system — font families, weights, and usage guidelines.</p>
      {config.typography.map(group => (
        <div key={group.group} className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#b0afa9] mb-6">{group.group}</p>
          {group.fonts.map(font => (
            <div key={font.name} className="bg-white border border-[#e8e7e4] rounded-2xl p-6 mb-6">
              {font.importUrl && (
                <style>{`@import url('${font.importUrl}');`}</style>
              )}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[18px] font-semibold mb-1" style={{ fontFamily: font.name }}>{font.name}</p>
                  <p className="text-[13px] text-[#8a8a85]">{font.role} · {font.usage}</p>
                </div>
                <div className="flex gap-1.5">
                  {font.weights.map(w => (
                    <span key={w} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#f0efec] text-[#8a8a85]">{w}</span>
                  ))}
                </div>
              </div>
              <div className="space-y-4 border-t border-[#f0efec] pt-4">
                {font.specimens.map(spec => (
                  <div key={spec.label} className="flex items-baseline gap-4">
                    <span className="text-[11px] text-[#b0afa9] w-16 shrink-0">{spec.label}</span>
                    <span
                      style={{ fontFamily: font.name, fontSize: spec.size, fontWeight: spec.weight, lineHeight: 1.2 }}
                      className="text-[#1a1a1a] leading-tight"
                    >
                      {spec.sample}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Assets Section ───────────────────────────────────────────────────────────

function AssetsSection({ sectionId }: { sectionId: string }) {
  const assets = config.assets[sectionId] || []
  const label = config.sections.find(s => s.id === sectionId)?.label || 'Assets'
  const isEmpty = assets.length === 0

  return (
    <div>
      <h1 className="text-[22px] font-bold tracking-tight mb-1">{label}</h1>
      <p className="text-[14px] text-[#8a8a85] mb-8">
        {sectionId === 'logo'
          ? 'Our logo system. Download approved assets and follow usage guidelines.'
          : `${label} organised by category. Download for presentations and marketing.`}
      </p>

      {isEmpty ? (
        <div className="border-2 border-dashed border-[#e8e7e4] rounded-2xl p-12 text-center">
          <p className="text-[14px] font-medium text-[#8a8a85] mb-1">No assets yet</p>
          <p className="text-[12px] text-[#b0afa9]">Add files to <code className="bg-[#f0efec] px-1 rounded">/public/brand/</code> and update <code className="bg-[#f0efec] px-1 rounded">brand.config.ts</code></p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {assets.map((asset, i) => (
            <div key={i} className="bg-white border border-[#e8e7e4] rounded-xl overflow-hidden group">
              <div className="h-36 flex items-center justify-center bg-[#f9f9f8] border-b border-[#e8e7e4] p-6">
                {asset.file.match(/\.(svg|png|jpg|jpeg|webp)$/i) ? (
                  <img
                    src={asset.file}
                    alt={asset.name}
                    className="max-h-full max-w-full object-contain"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="w-12 h-12 bg-[#e8e7e4] rounded-lg flex items-center justify-center">
                    <Icon name="guidelines" size={20} />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-[13px] font-medium text-[#1a1a1a] mb-1">{asset.name}</p>
                {asset.usage && <p className="text-[11px] text-[#8a8a85] mb-2 leading-tight">{asset.usage}</p>}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {asset.format.map(f => (
                      <span key={f} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#f0efec] text-[#8a8a85]">{f}</span>
                    ))}
                  </div>
                  <a
                    href={asset.file}
                    download
                    className="w-7 h-7 rounded-lg border border-[#e8e7e4] flex items-center justify-center hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a] transition-colors text-[#8a8a85]"
                  >
                    <Icon name="download" size={12} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Guidelines Section ───────────────────────────────────────────────────────

function GuidelinesSection() {
  const { voice, usage } = config.guidelines

  return (
    <div>
      <h1 className="text-[22px] font-bold tracking-tight mb-1">Guidelines</h1>
      <p className="text-[14px] text-[#8a8a85] mb-8">How to represent our brand correctly.</p>

      {voice && (
        <div className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#b0afa9] mb-4">{voice.title}</p>
          <p className="text-[14px] text-[#6b6b66] mb-4">{voice.description}</p>
          <div className="grid grid-cols-3 gap-4">
            {voice.principles.map(p => (
              <div key={p.name} className="bg-white border border-[#e8e7e4] rounded-xl p-4">
                <p className="text-[14px] font-semibold text-[#1a1a1a] mb-1">{p.name}</p>
                <p className="text-[13px] text-[#8a8a85] leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {usage && (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 mb-4">Do</p>
            <div className="space-y-2">
              {usage.dos.map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  <p className="text-[13px] text-[#1a1a1a] leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-red-500 mb-4">Don't</p>
            <div className="space-y-2">
              {usage.donts.map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-3">
                  <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M2 2l4 4M6 2L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </span>
                  <p className="text-[13px] text-[#1a1a1a] leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Brand Agent ──────────────────────────────────────────────────────────────

function BrandAgent() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, brandName: config.name }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', text: data.reply || 'Sorry, I could not answer that.' }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  if (!config.agent.enabled) return null

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-[#1a1a1a] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#333] transition-colors z-50"
      >
        <Icon name={open ? 'close' : 'chat'} size={18} />
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 w-80 bg-white border border-[#e8e7e4] rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden" style={{ height: 420 }}>
          <div className="px-4 py-3 border-b border-[#e8e7e4] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <p className="text-[13px] font-semibold">{config.agent.name}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-[12px] text-[#8a8a85] leading-relaxed">{config.agent.greeting}</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[13px] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#1a1a1a] text-white'
                    : 'bg-[#f5f5f3] text-[#1a1a1a]'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#f5f5f3] px-3 py-2 rounded-xl">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-[#b0afa9] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-[#e8e7e4] flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about our brand…"
              className="flex-1 text-[13px] px-3 py-2 bg-[#f5f5f3] rounded-lg outline-none placeholder:text-[#b0afa9]"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-8 h-8 bg-[#1a1a1a] text-white rounded-lg flex items-center justify-center disabled:opacity-40 hover:bg-[#333] transition-colors shrink-0"
            >
              <Icon name="send" size={13} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <aside className="w-56 shrink-0 border-r border-[#e8e7e4] bg-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#e8e7e4]">
        <div className="flex items-center gap-2.5">
          {config.logoUrl ? (
            <img src={config.logoUrl} alt={config.name} className="w-7 h-7 object-contain" onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
          ) : (
            <div className="w-7 h-7 bg-[#1a1a1a] rounded-md" />
          )}
          <div>
            <p className="text-[13px] font-semibold leading-tight">{config.name}</p>
            <p className="text-[10px] text-[#b0afa9]">Brand Hub</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b0afa9] px-2 mb-2">Assets</p>
        {config.sections.map(section => (
          <SidebarItem
            key={section.id}
            section={section}
            active={active === section.id}
            onSelect={onSelect}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#e8e7e4]">
        <a
          href="https://github.com/kleagogo/brandportal"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-[#b0afa9] hover:text-[#1a1a1a] transition-colors"
        >
          Open source — Star on GitHub ↗
        </a>
      </div>
    </aside>
  )
}

function SidebarItem({ section, active, onSelect }: { section: SectionConfig; active: boolean; onSelect: (id: string) => void }) {
  if (section.type === 'link' && section.url) {
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

  return (
    <button
      onClick={() => onSelect(section.id)}
      className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[13px] transition-colors text-left ${
        active
          ? 'bg-[#f0efec] text-[#1a1a1a] font-medium'
          : 'text-[#8a8a85] hover:text-[#1a1a1a] hover:bg-[#f5f5f3]'
      }`}
    >
      <Icon name={section.icon} size={14} />
      {section.label}
    </button>
  )
}

// ─── Main Hub ─────────────────────────────────────────────────────────────────

export default function HubPage() {
  const firstSection = config.sections[0]?.id || 'logo'
  const [active, setActive] = useState(firstSection)

  const activeSection = config.sections.find(s => s.id === active)

  function renderContent() {
    if (!activeSection) return null
    switch (activeSection.type) {
      case 'colors':     return <ColorsSection />
      case 'typography': return <TypographySection />
      case 'guidelines': return <GuidelinesSection />
      case 'assets':     return <AssetsSection sectionId={active} />
      default:           return <AssetsSection sectionId={active} />
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f9f8] flex">
      <Sidebar active={active} onSelect={setActive} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {renderContent()}
        </div>
      </main>

      <BrandAgent />
    </div>
  )
}
