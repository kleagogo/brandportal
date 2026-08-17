'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useHub } from './HubContext'
import { Icon } from './Icon'

interface Hit {
  kind: 'color' | 'font' | 'asset' | 'section'
  label: string
  detail: string
  sectionId: string
  swatchHex?: string
}

/**
 * The hub's search, as an overlay: ⌘K or ⌘Space from anywhere in the hub.
 *
 * It sits at the middle of the screen on a glass panel, and it searches
 * everything the hub holds: colors, fonts, assets, tags, sections. Picking a
 * hit jumps to its section.
 */
export function SearchOverlay({ onNavigate, onClose }: { onNavigate: (sectionId: string) => void; onClose: () => void }) {
  const { config } = useHub()
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

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
    // Before anyone types, the palette is a jump list of sections.
    if (!query) return index.filter(h => h.kind === 'section')
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
    onClose()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    // Escape closes the overlay only; edit mode underneath stays as it is.
    if (e.key === 'Escape') { e.stopPropagation(); onClose() }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) { e.stopPropagation(); pick(results[selected]) }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/10 backdrop-blur-[3px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div
        className="absolute left-1/2 top-[46%] -translate-x-1/2 w-[min(560px,calc(100vw-2rem))]"
        onClick={e => e.stopPropagation()}
      >
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/60">
            <span className="text-muted-foreground/70"><Icon name="search" size={15} /></span>
            <input
              ref={inputRef}
              value={q}
              onChange={e => { setQ(e.target.value); setSelected(0) }}
              onKeyDown={onKeyDown}
              placeholder="Search colors, fonts, files, tags"
              className="flex-1 min-w-0 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground/60"
            />
            <kbd className="text-[10px] font-medium text-muted-foreground/60 border border-border/60 rounded-md px-1.5 py-0.5">esc</kbd>
          </div>

          <div className="max-h-[38vh] overflow-y-auto py-1.5">
            {results.length === 0 ? (
              <p className="px-4 py-3 text-[13px] text-muted-foreground/60">No matches for “{q.trim()}”</p>
            ) : (
              results.map((hit, i) => (
                <button
                  key={`${hit.kind}-${hit.label}-${i}`}
                  onMouseDown={e => { e.preventDefault(); pick(hit) }}
                  onMouseEnter={() => setSelected(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selected ? 'bg-muted' : ''}`}
                >
                  {hit.swatchHex ? (
                    <span className="w-4.5 h-4.5 rounded-md border border-foreground/10 shrink-0" style={{ background: hit.swatchHex }} />
                  ) : (
                    <span className="text-muted-foreground/60 shrink-0">
                      <Icon name={hit.kind === 'font' ? 'type' : hit.kind === 'asset' ? 'screenshots' : 'guidelines'} size={14} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-medium text-foreground truncate">{hit.label}</span>
                    <span className="block text-[11.5px] text-muted-foreground/60 truncate">{hit.detail}</span>
                  </span>
                  {i === selected && <span className="text-[10px] text-muted-foreground/60 shrink-0">↵</span>}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
