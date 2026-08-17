'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { HubLabels } from '@/lib/labels'

/**
 * Set up the studio hub — the account's own brand, and the first hub someone
 * fills. Doing their own brand first means they learn the product on files
 * they own outright, and it gives client portals somewhere to borrow branding
 * from.
 */
export function StudioSetup({ labels }: { labels: HubLabels }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (busy || !name.trim()) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/hubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), studio: true }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.slug) throw new Error(data?.error || 'Couldn’t create your studio hub')
      router.push(`/${data.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t create your studio hub')
      setBusy(false)
    }
  }

  return (
    <Card className="gap-0 p-6">
      <form onSubmit={create}>
      <p className="text-[16px] font-semibold text-foreground mb-1">{labels.setupTitle}</p>
      <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-5 max-w-[58ch]">{labels.setupBody}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={labels.setupPlaceholder}
          aria-label={labels.setupPlaceholder}
          className="flex-1 min-w-[200px]"
        />
        <Button type="submit" disabled={busy || !name.trim()}>
          {busy ? 'Creating…' : labels.setupAction}
        </Button>
      </div>
        {error && <p className="text-[12.5px] text-destructive mt-3">{error}</p>}
      </form>
    </Card>
  )
}

/** Add another hub, named on the spot so it never reads "Untitled brand". */
export function NewHubButton({ labels }: { labels: HubLabels }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (busy || !name.trim()) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/hubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.slug) throw new Error(data?.error || 'Couldn’t create a client space')
      router.push(`/${data.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t create a client space')
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>{labels.newButton}</Button>
    )
  }

  return (
    <form onSubmit={create} className="flex items-center gap-2 flex-wrap justify-end">
      <Input
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Escape' && setOpen(false)}
        placeholder={labels.namePlaceholder}
        aria-label={labels.namePlaceholder}
        autoFocus
        className="w-auto"
      />
      <Button type="submit" disabled={busy || !name.trim()}>
        {busy ? 'Creating…' : 'Create'}
      </Button>
      <Button type="button" variant="ghost" onClick={() => { setOpen(false); setError('') }}>
        Cancel
      </Button>
      {error && <p className="text-[12px] text-destructive w-full text-right">{error}</p>}
    </form>
  )
}

export function AccountMenu({ email }: { email: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="default" size="icon" className="rounded-full uppercase" title={email}>
            {email[0]}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{email}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings" />}>Account settings</DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            // The logout route is a POST, so it needs a form rather than a link.
            const form = document.createElement('form')
            form.method = 'POST'
            form.action = '/api/auth/logout'
            document.body.appendChild(form)
            form.submit()
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
