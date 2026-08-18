'use client'

import { useState } from 'react'
import type { SectionConfig } from '@/app/types/brand'
import type { ImportBucket } from './route-files'
import { Icon } from './Icon'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle,
} from '@/components/ui/item'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
 *
 * Built from the library's own pieces — Dialog, Item, Collapsible — rather
 * than a hand-rolled panel. That is what retires the z-index the destination
 * menu used to need to sit above a plain div pretending to be a dialog.
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
  // Only the unmatched groups are adjustable; the rest are shown as they are.
  const [choices, setChoices] = useState<Record<string, Destination>>({})
  // A section name being typed inside a row's destination menu.
  const [naming, setNaming] = useState<Record<string, string>>({})
  // Which row's destination menu is open. Controlled so that naming a section
  // can close it: the confirmation is the row updating behind the menu, and
  // leaving it open hides the only feedback there is.
  const [menuFor, setMenuFor] = useState<string | null>(null)

  function destinationFor(bucket: ImportBucket): Destination {
    if (choices[bucket.key]) return choices[bucket.key]
    return bucket.sectionId
      ? { kind: 'section', sectionId: bucket.sectionId }
      : { kind: 'new', label: bucket.label }
  }

  /** Just the name — the badge beside it carries the "new" part. */
  function nameOf(destination: Destination): string {
    if (destination.kind === 'skip') return 'Not being added'
    if (destination.kind === 'new') return destination.label
    return sections.find(s => s.id === destination.sectionId)?.label || 'Section'
  }

  function chooseNewName(key: string, label: string) {
    const name = label.trim()
    if (!name) return
    setChoices(c => ({ ...c, [key]: { kind: 'new', label: name } }))
    setNaming(n => ({ ...n, [key]: '' }))
    setMenuFor(null)
  }

  const matched = buckets.filter(b => b.sectionId !== null)
  const proposed = buckets.filter(b => b.sectionId === null)
  const totalFiles = buckets.reduce((n, b) => n + b.items.length, 0)
  const newCount = proposed.filter(b => destinationFor(b).kind === 'new').length

  /** One group, as a row that opens onto the files inside it. */
  function BucketItem({ bucket, variant }: { bucket: ImportBucket; variant: 'muted' | 'outline' }) {
    const destination = destinationFor(bucket)
    const isNew = destination.kind === 'new'
    const typed = naming[bucket.key] ?? ''
    const adjustable = bucket.sectionId === null

    return (
      <Collapsible>
        <Item variant={variant} className="flex-col items-stretch gap-0">
          <div className="flex w-full items-center gap-3">
            <CollapsibleTrigger
              render={
                <button className="flex min-w-0 flex-1 items-center gap-3 text-left [&[data-panel-open]_[data-chevron]]:rotate-0" />
              }
            >
              <span data-chevron className="-rotate-90 text-muted-foreground/50 transition-transform">
                <Icon name="down" size={14} />
              </span>
              <ItemMedia variant="icon">
                <Icon name={bucket.icon} size={14} />
              </ItemMedia>
              <ItemContent className="gap-0.5">
                <ItemTitle className="gap-2">
                  {adjustable ? nameOf(destination) : bucket.label}
                  {isNew && <Badge variant="secondary">New section</Badge>}
                </ItemTitle>
                <ItemDescription>
                  {bucket.items.length} file{bucket.items.length === 1 ? '' : 's'}
                  {bucket.folder ? ` · from “${bucket.folder}”` : ''}
                </ItemDescription>
              </ItemContent>
            </CollapsibleTrigger>

            {adjustable && (
              <ItemActions>
                <DropdownMenu open={menuFor === bucket.key} onOpenChange={o => setMenuFor(o ? bucket.key : null)}>
                  <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="font-normal">Change</Button>} />
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Put these in</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setChoices(c => ({ ...c, [bucket.key]: { kind: 'new', label: bucket.label } }))}>
                        New section · {bucket.label}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>

                    {/* Naming it here rather than after the fact: the folder's
                        own name is a guess, and this is the moment someone
                        knows what they'd rather call it. */}
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Or name a new one</DropdownMenuLabel>
                      {/* The menu treats typing as its own keyboard navigation
                          and swallows it, so the field takes the keys back —
                          including select-all and the cursor keys. */}
                      <div
                        className="flex items-center gap-1.5 px-2 pb-1.5"
                        onKeyDown={e => e.stopPropagation()}
                        onKeyDownCapture={e => e.stopPropagation()}
                      >
                        <Input
                          value={typed}
                          placeholder="Section name"
                          aria-label="New section name"
                          className="h-8"
                          onClick={e => e.stopPropagation()}
                          onChange={e => setNaming(n => ({ ...n, [bucket.key]: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key !== 'Enter') return
                            e.preventDefault()
                            chooseNewName(bucket.key, typed)
                          }}
                        />
                        <Button size="sm" variant="outline" disabled={!typed.trim()} onClick={() => chooseNewName(bucket.key, typed)}>
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
              </ItemActions>
            )}
          </div>

          <CollapsibleContent>
            <ul className="mt-2 ml-6 flex flex-col gap-1 border-l pl-3">
              {bucket.items.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-muted-foreground">
                  <span className="truncate">{item.file.name}</span>
                  {item.path && <span className="shrink-0 truncate text-muted-foreground/50">{item.path}</span>}
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Item>
      </Collapsible>
    )
  }

  return (
    <Dialog open onOpenChange={o => { if (!o) onCancel() }}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>{totalFiles} file{totalFiles === 1 ? '' : 's'} sorted</DialogTitle>
          <DialogDescription>
            {scanning
              ? 'Reading the folders…'
              : proposed.length
                ? 'Check where everything is going, and open a row to see the files. Some folders need a section that doesn’t exist yet.'
                : 'Check where everything is going. Open a row to see the files.'}
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-1 flex max-h-[54vh] flex-col gap-5 overflow-y-auto px-1">
          {matched.length > 0 && (
            <ItemGroup className="gap-1.5">
              <p className="text-muted-foreground">Into existing sections</p>
              {matched.map(bucket => <BucketItem key={bucket.key} bucket={bucket} variant="muted" />)}
            </ItemGroup>
          )}

          {proposed.length > 0 && (
            <ItemGroup className="gap-1.5">
              <p className="text-muted-foreground">No section for these yet</p>
              {proposed.map(bucket => <BucketItem key={bucket.key} bucket={bucket} variant="outline" />)}
            </ItemGroup>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
