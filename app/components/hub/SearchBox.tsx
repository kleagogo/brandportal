'use client'

import { useMemo, useRef, useState } from 'react'
import { useHub } from './HubContext'
import { Icon } from './Icon'

interface Hit {
  kind: 'color' | 'font' | 'asset' | 'section'
  label: string
  detail: string
  sectionId: string
  swatchHex?: string
}

/** Search across everything in the hub — colors, fonts, assets, tags, sections. */
export function SearchBox({ onNavigate }: { onNavigate: (sectionId: string) => void }) {
  const { config } = useHub()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const index = useMemo<Hit[]>(() => {
    const hits: Hit[] = []
    const colorSection = config.sections.find(s => s.type === 'colors')?.id
    const typeSection = config.sections.find(s => s.type === 'typography')?.id

    for (const s of config.sections) {
      hits.push({ kind: 'section', label: s.label, detail: 'Section', sectionId: s.id })
    }
    if (colorSection) {
      for (const g of config.colors) {
        for (const sw of g.swatches) {
          hits.push({ kind: 'color', label: sw.name, detail: `${sw.hex.toUpperCase()}${sw.usage ? ` · ${sw.usage}` : ''}`, sectionId: colorSection, swatchHex: sw.hex })
        }
      }
    }
    if (typeSection) {
      for (const g of config.typography) {
        for (const f of g.fonts) {
          hits.push({ kind: 'font', label: f.name, detail: f.role, sectionId: typeSection })
        }
      }
    }
    for (const [sectionId, assets] of Object.entries(config.assets)) {
      const label = config.sections.find(s => s.id === sectionId)?.label || sectionId
      for (const a of assets) {
        hits.push({
          kind: 'asset',
          label: a.name,
          detail: `${label}${a.tags?.length ? ` · ${a.tags.map(t => `#${t}`).join(' ')}` : ''}`,
          sectionId,
        })
      }
    }
    return hits
  }, [config])

  const results = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (query.length < 2) return []
    return index
      .filter(h =>
        h.label.toLowerCase().includes(query) ||
        h.detail.toLowerCase().includes(query) ||
        (h.swatchHex && h.swatchHex.toLowerCase().includes(query))
      )
      .slice(0, 8)
  }, [q, index])

  function pick(hit: Hit) {
    onNavigate(hit.sectionId)
    setQ('')
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div className="relative hidden md:block w-56">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--hub-soft)] border border-transparent focus-within:border-[var(--hub-text)] focus-within:bg-[var(--hub-panel)] transition-colors">
        <span className="text-[var(--hub-faint)]"><Icon name="search" size={13} /></span>
        <input
          ref={inputRef}
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={e => { if (e.key === 'Enter' && results[0]) pick(results[0]); if (e.key === 'Escape') { setQ(''); setOpen(false) } }}
          placeholder="Search colors, assets, tags…"
          className="flex-1 min-w-0 bg-transparent text-[12.5px] outline-none placeholder:text-[var(--hub-faint)]"
        />
      </div>

      {open && q.trim().length >= 2 && (
        <div className="absolute top-10 left-0 right-0 z-40 bg-[var(--hub-panel)] border border-[var(--hub-border)] rounded-xl shadow-xl overflow-hidden">
          {results.length === 0 ? (
            <p className="px-3 py-2.5 text-[12px] text-[var(--hub-faint)]">Nothing matches “{q.trim()}”</p>
          ) : (
            results.map((hit, i) => (
              <button
                key={`${hit.kind}-${hit.label}-${i}`}
                onMouseDown={e => { e.preventDefault(); pick(hit) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--hub-soft)] transition-colors"
              >
                {hit.swatchHex ? (
                  <span className="w-4 h-4 rounded border border-black/10 shrink-0" style={{ background: hit.swatchHex }} />
                ) : (
                  <span className="text-[var(--hub-faint)] shrink-0">
                    <Icon name={hit.kind === 'font' ? 'type' : hit.kind === 'asset' ? 'screenshots' : 'guidelines'} size={13} />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-medium text-[var(--hub-text)] truncate">{hit.label}</span>
                  <span className="block text-[11px] text-[var(--hub-faint)] truncate">{hit.detail}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
