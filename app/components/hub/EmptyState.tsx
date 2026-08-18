'use client'

import { Icon } from './Icon'
import { Button } from '@/components/ui/button'
import { useHub } from './HubContext'
import {
  Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from '@/components/ui/empty'

/**
 * What a section says when it holds nothing yet.
 *
 * A new hub starts genuinely empty, so this is the first thing most sections
 * show their owner. A blank panel reads as broken, and worse, every control
 * for filling a section lives behind Edit mode — so someone looking at an
 * empty Colors page had nothing to click and no clue editing existed.
 *
 * The action here crosses that gap: it turns Edit on for the section on screen
 * and performs the first add in one press, so "how do I put something here"
 * has exactly one answer and it is the only button on the page.
 */
export function EmptyState({
  icon = 'plus',
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: {
  icon?: string
  title: string
  description: string
  actionLabel: string
  /** Runs after edit mode is on. Add the first row here. */
  onAction: () => void
  secondaryLabel?: string
  onSecondary?: () => void
}) {
  const { canEdit, sandbox, active, setEditingSection } = useHub()

  // A viewer who cannot edit gets the explanation without a button they would
  // not be allowed to press. Clients read these hubs too.
  const mayFill = canEdit || sandbox

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon name={icon} size={16} />
        </EmptyMedia>
        <EmptyTitle className="text-[15px]">{title}</EmptyTitle>
        <EmptyDescription className="text-[13px]">{description}</EmptyDescription>
      </EmptyHeader>

      {mayFill && (
        <EmptyContent>
          <Button
            variant="default"
            onClick={() => {
              setEditingSection(active)
              onAction()
            }}
          >
            {actionLabel}
          </Button>
          {secondaryLabel && onSecondary && (
            <Button variant="outline" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
        </EmptyContent>
      )}
    </Empty>
  )
}
