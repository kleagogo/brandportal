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
  // How much of the answer has been written out so far.
  const [shown, setShown] = useState(0)
  const [sources, setSources] = useState<string[]>([])
  const [thinking, setThinking] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * The answer writes itself out rather than appearing whole.
   *
   * The endpoint returns the reply in one piece, so the pacing is here: a few
   * characters a frame, which reads as the thing thinking rather than as a
   * page that flickered. Anyone who has asked for less motion gets it whole.
   */
  useEffect(() => {
    if (!answer) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const id = setTimeout(() => setShown(answer.length), 0)
      return () => clearTimeout(id)
    }
    const id = setInterval(() => {
      setShown(n => {
        if (n >= answer.length) { clearInterval(id); return n }
        return Math.min(n + 3, answer.length)
      })
    }, 16)
    return () => clearInterval(id)
  }, [answer])

  /**
   * The field takes the caret, not the mode pill.
   *
   * The pill is the first focusable thing inside the panel, so the dialog's
   * focus manager handed it the caret on open and every keystroke went to a
   * button — the palette looked alive and typed nothing. The frame delay puts
   * this after that manager runs, and the pill is out of the tab order so it
   * cannot take it back.
   */
  useEffect(() => {
    const focus = () => {
      const el = inputRef.current
        || document.querySelector<HTMLInputElement>('[data-slot=command-input]')
      el?.focus()
    }
    const frame = requestAnimationFrame(focus)
    return () => cancelAnimationFrame(frame)
  }, [mode])

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
    setShown(0)
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
      /* Glass: a thin wash of card colour over a heavy blur, so the hub is
         genuinely visible through it rather than behind a tinted sheet. Sits
         low, and the height caps so there is always 64px of air underneath. */
      className="top-[46%] flex max-h-[calc(54vh-64px)] flex-col overflow-hidden rounded-2xl! p-0 shadow-2xl supports-backdrop-filter:bg-popover/85 supports-backdrop-filter:backdrop-blur-xl sm:max-w-[560px]"
      /* Blurred, but lightly: a hub full of tiles reads as noise through clear
         glass, and the palette has to win. Still far lighter than the default
         scrim, so what you are searching stays sensed behind it. */
      overlayClassName="bg-foreground/15 supports-backdrop-filter:backdrop-blur-sm"
    >
      {/* shouldFilter off in Ask: the list there is an answer, not a filter. */}
      <Command shouldFilter={mode === 'search'} className="flex min-h-0 flex-1 flex-col bg-transparent">
        <div className="flex shrink-0 items-center gap-2 border-b border-border/60 p-2 [&_[data-slot=command-input-wrapper]]:min-w-0 [&_[data-slot=command-input-wrapper]]:flex-1 [&_[data-slot=command-input-wrapper]]:p-0">
          {/* Held down, not offered: the button is the mode you are in, so it
              stays looking pressed and carries that mode's own icon. */}
          <Button
            size="sm"
            variant="secondary"
            tabIndex={-1}
            aria-pressed
            /* The travelling border marks out the half that does something
               different in kind — Search reads the hub, Ask reasons about it. */
            className={`shrink-0 ${mode === 'ask' ? 't-moving-border' : ''}`}
            onClick={() => setMode(m => (m === 'search' ? 'ask' : 'search'))}
          >
            <span className={mode === 'ask' ? 't-spark' : undefined}>
              <Icon name={mode === 'search' ? 'search' : 'sparkles'} size={13} />
            </span>
            {mode === 'search' ? 'Search' : 'Ask AI'}
          </Button>
          <CommandInput
            ref={inputRef}
            value={q}
            onValueChange={setQ}
            onKeyDown={onKeyDown}
            placeholder={mode === 'search' ? 'Search commands…' : 'Ask anything about your brand…'}
          />
        </div>

        <CommandList className="min-h-0 flex-1">
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
                    <span className="flex items-center gap-1 px-0.5 py-1" aria-label="Thinking">
                      {[0, 1, 2].map(i => (
                        <span
                          key={i}
                          className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60"
                          style={{ animationDelay: `${i * 160}ms`, animationDuration: '900ms' }}
                        />
                      ))}
                    </span>
                  ) : (
                    <>
                      <p className="text-[14px] leading-relaxed">
                        {answer.slice(0, shown)}
                        {shown < answer.length && (
                          // The block the words come out of.
                          <span className="ml-px inline-block h-[1.05em] w-[0.45em] translate-y-[0.15em] bg-foreground/70" />
                        )}
                      </p>
                      {sources.length > 0 && shown >= answer.length && (
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
                      {shown >= answer.length && (
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
                      )}
                    </>
                  )}
                </div>
              )}

            </div>
          )}
        </CommandList>

        {/* Each half names the other one, so the switch is never hidden.

            Hidden on touch: it names two keys a phone hasn't got. The switch
            itself stays reachable there through the pill at the top and the
            "Ask AI a question instead" row. */}
        <div className="hidden shrink-0 items-center justify-between gap-3 border-t border-border/60 px-3 py-2 md:flex">
          <span className="flex items-center gap-2 text-muted-foreground">
            <kbd className="rounded-md bg-foreground/10 px-1.5 py-0.5 font-medium text-foreground">Tab</kbd>
            {mode === 'search' ? 'Ask AI' : 'Search commands'}
          </span>
          <span className="flex items-center gap-2 text-muted-foreground">
            {mode === 'search' ? 'Run' : 'Ask'}
            <kbd className="rounded-md bg-foreground/10 px-1.5 py-0.5 font-medium text-foreground">↵</kbd>
          </span>
        </div>
      </Command>
    </CommandDialog>
  )
}
