'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldContent, FieldGroup, FieldLabel } from '@/components/ui/field'

/** One labelled fact about the thing. Blank values are dropped by CardDetail. */
export interface DetailRow {
  label: string
  value: ReactNode
  /** Hexes, CSS and font stacks read better fixed-width. */
  mono?: boolean
}

/**
 * A card, opened up.
 *
 * Cards are deliberately small and identically sized, which means the third
 * line of a usage note is cut off and the full-size artwork is a thumbnail.
 * Tapping the picture opens the same thing with room: the media large, every
 * field spelled out, and — the part that matters — the card's own actions
 * carried across, so opening something is never a detour away from doing
 * anything with it.
 *
 * Rows with no value are dropped rather than shown empty, because most of
 * these fields are optional and a column of "—" is not information.
 */
export function CardDetail({
  open,
  onOpenChange,
  title,
  description,
  media,
  mediaClassName,
  rows = [],
  chips,
  actions,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  /** Shown large at the top, on the same grey as the card's own media. */
  media?: ReactNode
  mediaClassName?: string
  rows?: DetailRow[]
  chips?: ReactNode
  /** The card's actions, unchanged. */
  actions?: ReactNode
  children?: ReactNode
  /** Widen or otherwise reshape the dialog. Merged over the default width. */
  className?: string
}) {
  const filled = rows.filter(r => r.value !== null && r.value !== undefined && r.value !== '')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('sm:max-w-[460px]', className)}>
        <DialogHeader>
          <DialogTitle className="truncate">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* Header and actions stay put; only the middle scrolls. A typeface's
            full type scale is several screens of 64px headlines, and without
            this the title and the buttons were pushed off the top and bottom
            of the viewport. */}
        <div className="-mx-1 flex max-h-[68vh] flex-col gap-4 overflow-y-auto px-1">
        {media && (
          // shrink-0, or the scroll column squeezes the picture flat to avoid
          // scrolling — the one child that can give, giving everything.
          <div className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted p-6', mediaClassName)}>
            {media}
          </div>
        )}

        {chips && <div className="flex flex-wrap items-center gap-1">{chips}</div>}

        {/* The horizontal Field variant gives its label flex-auto, which pushes
            the value out to the right edge; the label is a fixed gutter here,
            so it is pinned back to its own width. */}
        {filled.length > 0 && (
          <FieldGroup className="gap-3">
            {filled.map(row => (
              <Field
                key={row.label}
                orientation="horizontal"
                className="items-baseline gap-3 [&>[data-slot=field-label]]:flex-none"
              >
                <FieldLabel className="w-20 shrink-0 text-muted-foreground">{row.label}</FieldLabel>
                <FieldContent className={cn('min-w-0 break-words', row.mono && 'font-mono')}>
                  {row.value}
                </FieldContent>
              </Field>
            ))}
          </FieldGroup>
        )}

        {children}
        </div>

        {actions && <DialogFooter className="sm:justify-end">{actions}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}
