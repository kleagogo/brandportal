'use client'

import { useState } from 'react'
import type { SectionConfig } from '@/app/types/brand'
import type { ImportBucket } from './route-files'
import { Icon } from './Icon'
import { useModalTransition } from '../transitions'
import { Button } from '@/components/ui/button'
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className={`absolute inset-0 bg-foreground/30 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
      <div className={`t-modal ${transition.className} relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-[520px] p-6`} role="dialog" aria-modal="true">
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
              ? 'Check where everything is going. Some folders need a section that doesn’t exist yet.'
              : 'Check where everything is going.'}
        </p>

        <div className="max-h-[46vh] overflow-y-auto flex flex-col gap-4 -mx-1 px-1">
          {matched.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">Into existing sections</p>
              {matched.map(bucket => (
                <div key={bucket.key} className="flex items-center gap-2.5 rounded-xl bg-muted px-3 py-2">
                  <span className="text-muted-foreground shrink-0"><Icon name={bucket.icon} size={14} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium truncate">{bucket.label}</span>
                    <span className="block text-[11.5px] text-muted-foreground/60 truncate">
                      {bucket.items.length} file{bucket.items.length === 1 ? '' : 's'}
                      {bucket.folder ? ` · from “${bucket.folder}”` : ''}
                    </span>
                  </span>
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
                return (
                  <div key={bucket.key} className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2">
                    <span className="text-muted-foreground shrink-0"><Icon name={bucket.icon} size={14} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium truncate">“{bucket.folder}”</span>
                      <span className="block text-[11.5px] text-muted-foreground/60 truncate">
                        {bucket.items.length} file{bucket.items.length === 1 ? '' : 's'} · {describe(destination)}
                      </span>
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="outline" size="sm" className="shrink-0 font-normal">Change</Button>}
                      />
                      {/* Above the dialog this sits in — see DatePicker for
                          the same note; both go away once the app's modals
                          move to <Dialog>. */}
                      <DropdownMenuContent align="end" className="w-56" positionerClassName="z-[70]">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-muted-foreground text-xs">Put these in</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setChoices(c => ({ ...c, [bucket.key]: { kind: 'new', label: bucket.label } }))}>
                            New section · {bucket.label}
                          </DropdownMenuItem>
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
