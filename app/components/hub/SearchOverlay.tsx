'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useHub } from './HubContext'
import { Icon } from './Icon'
import { Button } from '@/components/ui/button'
import {
  Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandShortcut,
} from '@/components/ui/command'

interface Hit {
  kind: 'color' | 'font' | 'asset' | 'section'
  label: string
  detail: string
  sectionId: string
  swatchHex?: string
}

/** Which half of the palette is in front. Tab swaps them. */
type Mode = 'search' | 'ask'

/** Openers the hub can answer well, offered before anyone types. */
const SUGGESTED = [
  'What are our brand colors?',
  'Which typeface do headlines use?',
  'Where do I find the logo files?',
]

/**
 * The hub's command palette: ⌘K or ⌘Space from anywhere in the hub.
 *
 * Two halves behind one key. Search walks everything the hub holds — colors,
 * fonts, files, tags, sections — and picking a hit jumps to it. Ask puts the
 * same question to the Brand Agent, which answers from this hub's own data.
 *
 * Tab is the switch, and each half names the other one in its footer, because
 * a mode you can't see the door to is a mode nobody finds. The whole thing is
 * the library's own Command, so the arrow keys, filtering and selection are
 * the ones every other shadcn palette has.
 */
export function SearchOverlay({ onNavigate, onClose }: { onNavigate: (sectionId: string) => void; onClose: () => void }) {
  const { config } = useHub()
  const [mode, setMode] = useState<Mode>('search')
  const [q, setQ] = useState('')
  // The question that produced the answer on screen, kept so the answer stays
  // readable while the next question is being typed.
  const [asked, setAsked] = useState('')
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState<string[]>([])
  const [thinking, setThinking] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [mode])

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
          hits.push({
            kind: 'color',
            label: sw.name,
            detail: `${sw.hex.toUpperCase()}${sw.usage ? ` · ${sw.usage}` : ''}`,
            sectionId: colorSection,
            swatchHex: sw.hex,
          })
        }
      }
    }
    if (typeSection) {
      for (const g of config.typography) {
        for (const f of g.fonts) {
          hits.push({ kind: 'font', label: f.name, detail: f.primaryLabel || f.role, sectionId: typeSection })
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

  const sections = index.filter(h => h.kind === 'section')
  const rest = index.filter(h => h.kind !== 'section')

  function pick(hit: Hit) {
    onNavigate(hit.sectionId)
    onClose()
  }

  /** Put the question to the Brand Agent. The demo is answered server-side. */
  async function ask(question: string) {
    const text = question.trim()
    if (!text || thinking) return
    setAsked(text)
    setAnswer('')
    setSources([])
    setThinking(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, slug: config.slug }),
      })
      const data = await res.json()
      setAnswer(data.reply || 'Sorry, I could not answer that.')
      // What the hub could have drawn on — the sections that exist to be read.
      setSources(config.sections.filter(s => s.type !== 'link').slice(0, 3).map(s => s.label))
    } catch {
      setAnswer('Something went wrong. Please try again.')
    } finally {
      setThinking(false)
    }
  }

  /**
   * Tab swaps halves, and the text comes with it.
   *
   * Bound to the input rather than the palette: the dialog's focus guards emit
   * a Tab of their own while it opens, and a listener on the wrapper caught
   * that too, so the palette opened on whichever half it wasn't asked for.
   * cmdk keeps focus in the input anyway, so this is where the gesture is.
   */
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Tab') {
      e.preventDefault()
      setMode(m => (m === 'search' ? 'ask' : 'search'))
      return
    }
    if (e.key === 'Enter' && mode === 'ask') {
      // cmdk also claims Enter for the highlighted item; in Ask there is no
      // list to claim, and stopping it keeps the two from both firing.
      e.preventDefault()
      e.stopPropagation()
      ask(q)
    }
  }

  return (
    <CommandDialog
      open
      onOpenChange={o => { if (!o) onClose() }}
      title="Search this hub"
      description="Search colors, type and files, or ask the Brand Agent."
      /* Glass, and sitting lower than a dialog would: the palette is a thing
         laid over the hub rather than a page of its own, so the panel is
         translucent and the hub stays legible through it. */
      className="top-[22%] border border-border/60 bg-card/80 shadow-2xl backdrop-blur-2xl supports-backdrop-filter:bg-card/70 sm:max-w-[560px]"
      /* No blur, barely a tint — you are searching what is behind this, and
         the results are worth watching as you type. */
      overlayClassName="bg-foreground/10 supports-backdrop-filter:backdrop-blur-none"
    >
      {/* shouldFilter off in Ask: the list there is an answer, not a filter. */}
      <Command shouldFilter={mode === 'search'} className="bg-transparent">
        <div className="flex items-center gap-2 border-b border-border/60 p-2">
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => setMode(m => (m === 'search' ? 'ask' : 'search'))}
            title="Tab to switch"
          >
            <Icon name="sparkles" size={13} />
            {mode === 'search' ? 'Search' : 'Ask AI'}
          </Button>
          <CommandInput
            ref={inputRef}
            value={q}
            onValueChange={setQ}
            onKeyDown={onKeyDown}
            placeholder={mode === 'search' ? 'Search commands…' : 'Ask anything about your brand…'}
            className="flex-1"
          />
        </div>

        <CommandList className="max-h-[46vh]">
          {mode === 'search' ? (
            <>
              <CommandEmpty>No matches for “{q.trim()}”</CommandEmpty>

              <CommandGroup heading="Sections">
                {sections.map(hit => (
                  <CommandItem key={`s-${hit.sectionId}`} value={`${hit.label} ${hit.detail}`} onSelect={() => pick(hit)}>
                    <Icon name="guidelines" size={14} />
                    {hit.label}
                  </CommandItem>
                ))}
              </CommandGroup>

              {rest.length > 0 && (
                <CommandGroup heading="In this hub">
                  {rest.map((hit, i) => (
                    <CommandItem
                      key={`h-${hit.kind}-${i}`}
                      value={`${hit.label} ${hit.detail} ${hit.swatchHex || ''}`}
                      onSelect={() => pick(hit)}
                    >
                      {hit.swatchHex ? (
                        <span
                          className="size-3.5 shrink-0 rounded-sm border border-foreground/10"
                          style={{ background: hit.swatchHex }}
                        />
                      ) : (
                        <Icon name={hit.kind === 'font' ? 'type' : 'screenshots'} size={14} />
                      )}
                      <span className="min-w-0 flex-1 truncate">{hit.label}</span>
                      <span className="truncate text-muted-foreground">{hit.detail}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              <CommandGroup>
                <CommandItem value="ask ai a question instead" onSelect={() => setMode('ask')}>
                  <Icon name="sparkles" size={14} />
                  Ask AI a question instead
                  <CommandShortcut>Tab</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </>
          ) : (
            <div className="p-3">
              {!asked && !thinking && (
                <div className="flex flex-col gap-1">
                  <p className="px-1 pb-1 text-muted-foreground">Try asking</p>
                  {SUGGESTED.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setQ(s); ask(s) }}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-[13px] transition-colors hover:bg-muted"
                    >
                      {s}
                      <Icon name="right" size={14} />
                    </button>
                  ))}
                </div>
              )}

              {(asked || thinking) && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
                      <Icon name="sparkles" size={12} />
                    </span>
                    <p className="min-w-0 flex-1 truncate text-[14px] font-medium">{asked}</p>
                  </div>

                  {thinking ? (
                    <p className="text-[13px] text-muted-foreground">Reading your brand…</p>
                  ) : (
                    <>
                      <p className="text-[14px] leading-relaxed">{answer}</p>
                      {sources.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[12px] text-muted-foreground">Sources</span>
                          {sources.map(s => (
                            <span
                              key={s}
                              className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[12px]"
                            >
                              <Icon name="file" size={11} /> {s}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-col gap-1 border-t pt-3">
                        <p className="px-1 pb-0.5 text-muted-foreground">Related questions</p>
                        {SUGGESTED.filter(s => s !== asked).map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => { setQ(s); ask(s) }}
                            className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-muted"
                          >
                            {s}
                            <Icon name="right" size={14} />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          )}
        </CommandList>

        {/* Each half names the other one, so the switch is never hidden. */}
        <div className="flex items-center justify-between gap-3 border-t border-border/60 px-3 py-2">
          <span className="flex items-center gap-2 text-muted-foreground">
            <kbd className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground">Tab</kbd>
            {mode === 'search' ? 'Ask AI' : 'Search commands'}
          </span>
          <span className="flex items-center gap-2 text-muted-foreground">
            {mode === 'search' ? 'Run' : 'Ask'}
            <kbd className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground">↵</kbd>
          </span>
        </div>
      </Command>
    </CommandDialog>
  )
}
