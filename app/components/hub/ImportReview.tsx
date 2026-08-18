'use client'

import { useState } from 'react'
import type { SectionConfig } from '@/app/types/brand'
import type { ImportBucket } from './route-files'
import { Icon } from './Icon'
import { useModalTransition } from '../transitions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/** What the person chose to do with one group of files. */
export type Destination =
  | { kind: 'section'; sectionId: string }
  | { kind: 'new'; label: string }
  | { kind: 'skip' }

export interface ImportDecision {
  bucket: ImportBucket
  destination: Destination
}

/**
 * The last word before a dropped folder lands.
 *
 * Sorting files automatically is only worth doing if you can see what it did
 * first, so this shows every group and where it's going, and asks about the
 * folders that would need a new section rather than inventing one silently.
 */
export function ImportReview({
  buckets, sections, scanning, onConfirm, onCancel,
}: {
  buckets: ImportBucket[]
  sections: SectionConfig[]
  /** The AI pass is still running; the plan may still change under them. */
  scanning: boolean
  onConfirm: (decisions: ImportDecision[]) => void
  onCancel: () => void
}) {
  const [open, setOpen] = useState(true)
  const transition = useModalTransition(open, onCancel)
  // Only the unmatched groups are adjustable; the rest are shown as they are.
  const [choices, setChoices] = useState<Record<string, Destination>>({})
  // Which rows have their file list showing. Collapsed by default: the point
  // of this dialog is the plan, and the files are the evidence for it.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  // A section name being typed inside a row's dropdown.
  const [naming, setNaming] = useState<Record<string, string>>({})
  // Which row's destination menu is open. Controlled so that naming a section
  // can close it: the confirmation is the row updating behind the menu, and
  // leaving it open hides the only feedback there is.
  const [menuFor, setMenuFor] = useState<string | null>(null)

  function chooseNewName(key: string, label: string) {
    const name = label.trim()
    if (!name) return
    setChoices(c => ({ ...c, [key]: { kind: 'new', label: name } }))
    setNaming(n => ({ ...n, [key]: '' }))
    setMenuFor(null)
  }

  const toggle = (key: string) => setExpanded(e => ({ ...e, [key]: !e[key] }))

  function destinationFor(bucket: ImportBucket): Destination {
    if (choices[bucket.key]) return choices[bucket.key]
    return bucket.sectionId
      ? { kind: 'section', sectionId: bucket.sectionId }
      : { kind: 'new', label: bucket.label }
  }

  function describe(destination: Destination): string {
    if (destination.kind === 'skip') return 'Don’t add these'
    if (destination.kind === 'new') return `New section · ${destination.label}`
    return sections.find(s => s.id === destination.sectionId)?.label || 'Section'
  }

  const matched = buckets.filter(b => b.sectionId !== null)
  const proposed = buckets.filter(b => b.sectionId === null)
  const totalFiles = buckets.reduce((n, b) => n + b.items.length, 0)
  const newCount = proposed.filter(b => destinationFor(b).kind === 'new').length

  if (!transition.mounted) return null

  /** The files inside one group, once someone asks to see them. */
  function FileList({ bucket }: { bucket: ImportBucket }) {
    if (!expanded[bucket.key]) return null
    return (
      <ul className="mt-2 ml-1 flex flex-col gap-1 border-l border-border pl-3">
        {bucket.items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className="truncate">{item.file.name}</span>
            {item.path && (
              <span className="shrink-0 text-[11px] text-muted-foreground/50 truncate">{item.path}</span>
            )}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className={`absolute inset-0 bg-foreground/30 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
      <div className={`t-modal ${transition.className} relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-[680px] p-7`} role="dialog" aria-modal="true">
        <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-muted-foreground/60 hover:text-foreground transition-colors" title="Close">
          <Icon name="close" size={14} />
        </button>

        <h2 className="text-[17px] font-bold tracking-tight mb-1">
          {totalFiles} file{totalFiles === 1 ? '' : 's'} sorted
        </h2>
        <p className="text-[13px] text-muted-foreground mb-5">
          {scanning
            ? 'Reading the folders…'
            : proposed.length
              ? 'Check where everything is going, and open a row to see the files. Some folders need a section that doesn’t exist yet.'
              : 'Check where everything is going. Open a row to see the files.'}
        </p>

        <div className="max-h-[54vh] overflow-y-auto flex flex-col gap-5 -mx-1 px-1">
          {matched.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">Into existing sections</p>
              {matched.map(bucket => (
                <div key={bucket.key} className="rounded-xl bg-muted px-3 py-2">
                  <button onClick={() => toggle(bucket.key)} className="flex w-full items-start gap-2.5 text-left">
                    <span className={`flex h-[1.5em] shrink-0 items-center text-[13px] text-muted-foreground/50 transition-transform ${expanded[bucket.key] ? '' : '-rotate-90'}`}>
                      <Icon name="down" size={14} />
                    </span>
                    <span className="flex h-[1.5em] shrink-0 items-center text-[13px] text-muted-foreground"><Icon name={bucket.icon} size={14} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium truncate">{bucket.label}</span>
                      <span className="block text-[11.5px] text-muted-foreground/60 truncate">
                        {bucket.items.length} file{bucket.items.length === 1 ? '' : 's'}
                        {bucket.folder ? ` · from “${bucket.folder}”` : ''}
                      </span>
                    </span>
                  </button>
                  <FileList bucket={bucket} />
                </div>
              ))}
            </div>
          )}

          {proposed.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                No section for these yet
              </p>
              {proposed.map(bucket => {
                const destination = destinationFor(bucket)
                const typed = naming[bucket.key] ?? ''
                return (
                  <div key={bucket.key} className="rounded-xl border border-border px-3 py-2">
                    <div className="flex items-start gap-2.5">
                      <button onClick={() => toggle(bucket.key)} className="flex min-w-0 flex-1 items-start gap-2.5 text-left">
                        <span className={`flex h-[1.5em] shrink-0 items-center text-[13px] text-muted-foreground/50 transition-transform ${expanded[bucket.key] ? '' : '-rotate-90'}`}>
                          <Icon name="down" size={14} />
                        </span>
                        <span className="flex h-[1.5em] shrink-0 items-center text-[13px] text-muted-foreground"><Icon name={bucket.icon} size={14} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-[13px] font-medium truncate">“{bucket.folder}”</span>
                            {/* Says plainly that agreeing here adds a menu item,
                                which is the one consequence that outlasts the
                                upload. */}
                            {destination.kind === 'new' && (
                              <Badge variant="secondary" className="shrink-0 text-[10px]">New section</Badge>
                            )}
                          </span>
                          <span className="block text-[11.5px] text-muted-foreground/60 truncate">
                            {bucket.items.length} file{bucket.items.length === 1 ? '' : 's'} · {describe(destination)}
                          </span>
                        </span>
                      </button>
                      <DropdownMenu open={menuFor === bucket.key} onOpenChange={o => setMenuFor(o ? bucket.key : null)}>
                        <DropdownMenuTrigger
                          render={<Button variant="outline" size="sm" className="shrink-0 font-normal">Change</Button>}
                        />
                        {/* Above the dialog this sits in — see DatePicker for
                            the same note; both go away once the app's modals
                            move to <Dialog>. */}
                        <DropdownMenuContent align="end" className="w-64" positionerClassName="z-[70]">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-muted-foreground text-xs">Put these in</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setChoices(c => ({ ...c, [bucket.key]: { kind: 'new', label: bucket.label } }))}>
                              New section · {bucket.label}
                            </DropdownMenuItem>
                          </DropdownMenuGroup>

                          {/* Naming it here rather than after the fact: the
                              folder's own name is a guess, and this is the
                              moment someone knows what they'd rather call it. */}
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-muted-foreground text-xs">Or name a new one</DropdownMenuLabel>
                            {/* The menu treats typing as its own keyboard
                                navigation and swallows it, so the field takes
                                the keys back — including the select-all and
                                cursor keys people expect while editing. */}
                            <div
                              className="flex items-center gap-1.5 px-2 pb-1.5"
                              onKeyDown={e => e.stopPropagation()}
                              onKeyDownCapture={e => e.stopPropagation()}
                            >
                              <Input
                                value={typed}
                                placeholder="Section name"
                                aria-label="New section name"
                                className="h-8 text-[12.5px]"
                                onClick={e => e.stopPropagation()}
                                onChange={e => setNaming(n => ({ ...n, [bucket.key]: e.target.value }))}
                                onKeyDown={e => {
                                  if (e.key !== 'Enter') return
                                  e.preventDefault()
                                  chooseNewName(bucket.key, typed)
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!typed.trim()}
                                onClick={() => chooseNewName(bucket.key, typed)}
                              >
                                Add
                              </Button>
                            </div>
                          </DropdownMenuGroup>

                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            {sections
                              .filter(s => ['assets', 'colors', 'typography', 'guidelines'].includes(s.type))
                              .map(section => (
                                <DropdownMenuItem
                                  key={section.id}
                                  onClick={() => setChoices(c => ({ ...c, [bucket.key]: { kind: 'section', sectionId: section.id } }))}
                                >
                                  {section.label}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => setChoices(c => ({ ...c, [bucket.key]: { kind: 'skip' } }))}>
                              Don’t add these
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <FileList bucket={bucket} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-5">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => onConfirm(buckets.map(bucket => ({ bucket, destination: destinationFor(bucket) })))}
            disabled={scanning}
          >
            {scanning
              ? 'Reading…'
              : newCount
                ? `Add files and ${newCount} section${newCount === 1 ? '' : 's'}`
                : 'Add files'}
          </Button>
        </div>
      </div>
    </div>
  )
}
