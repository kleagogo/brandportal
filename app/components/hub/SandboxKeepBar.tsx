'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Icon } from './Icon'
import { useHub } from './HubContext'

/**
 * The demo's one ask.
 *
 * A visitor can spend ten minutes in the sandbox recolouring a hub and
 * dropping their own logo into it, and until now the only thing that ever
 * mentioned the work was going nowhere was a line inside Hub settings. So the
 * moment someone has shown they want this — by making it theirs — passed in
 * silence, and they closed the tab. The sidebar's "Sign in" was the only way
 * on, which is a door for people who already have an account, not an offer.
 *
 * It waits for `touched` rather than appearing on arrival, because a bar that
 * greets you is an ad and a bar that answers something you just did is a
 * useful warning. It says the changes are going away, which is true, and does
 * not promise to bring them along, which would not be: the sandbox lives in
 * this component tree and signing up starts a hub from blank. Carrying them
 * over is worth building — it is the old claim flow in a new coat — but it has
 * to be built before it can be said.
 */
export function SandboxKeepBar() {
  const { sandbox, touched } = useHub()
  const [dismissed, setDismissed] = useState(false)

  if (!sandbox || !touched || dismissed) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 pointer-events-none">
      {/* Stacked on a phone, in a row from sm up. Side by side at 390px the
          sentence wrapped to five lines beside a button, which is a paragraph
          with something stuck to it rather than a prompt. */}
      <div className="pointer-events-auto w-full sm:w-auto max-w-[560px] rounded-xl bg-popover/95 px-4 py-3 shadow-lg ring-1 ring-foreground/10 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
        <div className="flex items-start sm:items-center gap-3">
          <span className="hidden sm:block shrink-0 text-muted-foreground">
            <Icon name="sparkles" size={15} />
          </span>

          <p className="flex-1 min-w-0 text-[13px] leading-snug text-foreground">
            You’re editing the demo —{' '}
            <span className="text-muted-foreground">
              this resets when you reload.{' '}
              <span className="hidden sm:inline">Start a space of your own and build the real one.</span>
            </span>
          </p>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Dismiss"
            onClick={() => setDismissed(true)}
            className="shrink-0 -mt-0.5 sm:mt-0 sm:order-last text-muted-foreground"
          >
            <Icon name="close" size={13} />
          </Button>

          <Button
            nativeButton={false}
            render={<Link href="/login" />}
            variant="default"
            size="lg"
            className="hidden sm:inline-flex shrink-0"
          >
            Create my space
          </Button>
        </div>

        {/* Full width under the text on a phone, where a thumb expects it. */}
        <Button
          nativeButton={false}
          render={<Link href="/login" />}
          variant="default"
          size="lg"
          className="sm:hidden mt-3 w-full"
        >
          Create my space
        </Button>
      </div>
    </div>
  )
}
