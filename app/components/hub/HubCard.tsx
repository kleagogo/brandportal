'use client'

import type { ReactNode, Ref } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * One card anatomy for the whole hub.
 *
 * Swatches, gradients, assets, typefaces and guideline principles were each
 * built separately, so they ended up with three different shapes: media inset
 * on one and bleeding on another, a divider on one and not the others, and
 * anywhere from one to four rows of metadata. Sharing radius and background
 * wasn't enough — the structure has to match too.
 *
 * The shape is: full-bleed media, then a body, then an optional footer whose
 * left side holds chips and right side holds the single action. Every part
 * except the body is optional, so a gradient with a name and one button and an
 * asset with tags and formats are the same card with different slots filled.
 */
export function HubCard({
  media,
  mediaClassName,
  children,
  chips,
  action,
  className,
  ref,
  ...rest
}: {
  /** Fills the top edge-to-edge — an image, a colour, a gradient. */
  media?: ReactNode
  mediaClassName?: string
  /** Name, note, tags. */
  children: ReactNode
  /** Footer left: formats, sizes, anything small and repeated. */
  chips?: ReactNode
  /** Footer right: the one thing this card does. */
  action?: ReactNode
  className?: string
  ref?: Ref<HTMLDivElement>
} & Omit<React.ComponentProps<'div'>, 'ref' | 'children'>) {
  return (
    <Card ref={ref} size="sm" className={cn('gap-0 py-0', className)} {...rest}>
      {media && (
        <div className={cn('flex items-center justify-center overflow-hidden bg-muted', mediaClassName)}>
          {media}
        </div>
      )}
      <div className="flex flex-col gap-1.5 p-3">
        {children}
        {(chips || action) && (
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1 flex-wrap min-w-0">{chips}</div>
            {action}
          </div>
        )}
      </div>
    </Card>
  )
}
