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
  header,
  media,
  mediaClassName,
  children,
  chips,
  action,
  className,
  ref,
  ...rest
}: {
  /**
   * A text band across the top, in the same grey as `media`. For cards whose
   * subject is words rather than a picture — a typeface, a principle — so they
   * still read as the same card as one with an image.
   */
  header?: ReactNode
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
    <Card
      ref={ref}
      size="sm"
      // The ring darkens on hover so a card reads as a thing you can act on.
      // `h-full` so every card in a row is the height of the tallest, and the
      // body below flexes, which is what keeps the footers on one line.
      className={cn('h-full gap-0 py-0 transition-[box-shadow] hover:ring-muted-foreground', className)}
      {...rest}
    >
      {header && (
        <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted px-3 py-2.5">
          {header}
        </div>
      )}
      {media && (
        <div className={cn('flex items-center justify-center overflow-hidden bg-muted', mediaClassName)}>
          {media}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {children}
        {(chips || action) && (
          /* items-end, not center: when the chips wrap to several rows the
             action stays put in the bottom corner instead of floating up the
             card — it is part of the card's anatomy, not of the chip flow. */
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <div className="flex items-center gap-1 flex-wrap min-w-0">{chips}</div>
            <div className="shrink-0">{action}</div>
          </div>
        )}
      </div>
    </Card>
  )
}
