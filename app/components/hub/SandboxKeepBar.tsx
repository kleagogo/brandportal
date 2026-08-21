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
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-popover/95 px-4 py-3 shadow-lg ring-1 ring-foreground/10 backdrop-blur-sm max-w-[min(560px,100%)] animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
        <span className="hidden sm:block shrink-0 text-muted-foreground">
          <Icon name="sparkles" size={15} />
        </span>

        <p className="text-[13px] leading-snug text-foreground min-w-0">
          You’re editing the demo —{' '}
          <span className="text-muted-foreground">
            this resets when you reload. Start a space of your own and build the real one.
          </span>
        </p>

        <Button
          nativeButton={false}
          render={<Link href="/login" />}
          variant="default"
          size="lg"
          className="shrink-0"
        >
          Create my space
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-muted-foreground"
        >
          <Icon name="close" size={13} />
        </Button>
      </div>
    </div>
  )
}
