'use client'

import type { ReactNode } from 'react'
import { Icon } from './Icon'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

/** One dropdown in the toolbar. Sorting is the same control as filtering. */
export interface SelectControl {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  /** Accessible name — several of these sit side by side. */
  label: string
  className?: string
}

/**
 * The top of every section: heading, its own actions, and the row for finding
 * things in it.
 *
 * Assets grew a search field, a filter, a sort and a grid/list toggle while
 * Colors, Typography and Guidelines kept a bare `h1` and a sentence — so the
 * same hub taught you a different page shape depending on which one you opened,
 * and a palette of sixty swatches had no way to find one.
 *
 * What goes in the toolbar is the caller's business, because the useful filter
 * differs per section: formats for files, groups for colours, do-or-don't for
 * guidelines. What is shared is where those controls sit and what they look
 * like. `toolbar` is how a section says it has too little to be worth
 * searching; below that threshold the content is the whole answer.
 */
export function SectionHeader({
  title,
  description,
  actions,
  search,
  filters = [],
  sort,
  view,
  toolbar = true,
}: {
  title: ReactNode
  /** Omit entirely for sections whose empty state does the explaining. */
  description?: ReactNode
  /** Small outline buttons beside the heading. Acts on this section. */
  actions?: ReactNode
  search?: { value: string; onChange: (v: string) => void; placeholder: string; label: string }
  filters?: SelectControl[]
  sort?: SelectControl
  view?: { value: 'grid' | 'list'; onChange: (v: 'grid' | 'list') => void }
  /** False hides the whole find-things row. */
  toolbar?: boolean
}) {
  const controls = [...filters, ...(sort ? [sort] : [])]
  const hasToolbar = toolbar && Boolean(search || controls.length || view)

  return (
    <>
      <div className="mb-1 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-[22px] font-bold tracking-tight">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {description
        ? <p className="mb-8 text-[14px] text-muted-foreground">{description}</p>
        : <div className="mb-8" />}

      {hasToolbar && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {search && (
            <div className="relative w-full sm:max-w-xs">
              <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground">
                <Icon name="search" size={14} />
              </span>
              <Input
                type="search"
                value={search.value}
                onChange={e => search.onChange(e.target.value)}
                placeholder={search.placeholder}
                className="pl-8"
                aria-label={search.label}
              />
            </div>
          )}

          {(controls.length > 0 || view) && (
            <div className="flex items-center gap-2 sm:ml-auto">
              {controls.map(control => (
                <Select
                  key={control.label}
                  value={control.value}
                  onValueChange={v => control.onChange(v ?? control.options[0]?.value ?? '')}
                >
                  <SelectTrigger className={control.className || 'w-36'} aria-label={control.label}>
                    {/* Base UI renders the raw value unless given something to show. */}
                    <SelectValue>
                      {control.options.find(o => o.value === control.value)?.label ?? control.value}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {control.options.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}

              {/* Brand work is looked at as much as read, so the grid stays the
                  default; the list is for a section deep enough that tiles turn
                  into scrolling. */}
              {view && (
                <ButtonGroup>
                  <Button
                    size="icon"
                    variant={view.value === 'grid' ? 'default' : 'outline'}
                    aria-label="Grid view"
                    aria-pressed={view.value === 'grid'}
                    onClick={() => view.onChange('grid')}
                  >
                    <Icon name="grid" size={14} />
                  </Button>
                  <Button
                    size="icon"
                    variant={view.value === 'list' ? 'default' : 'outline'}
                    aria-label="List view"
                    aria-pressed={view.value === 'list'}
                    onClick={() => view.onChange('list')}
                  >
                    <Icon name="list" size={14} />
                  </Button>
                </ButtonGroup>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
