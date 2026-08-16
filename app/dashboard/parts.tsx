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
 * Asked once, on an empty account: agency or single brand. It only decides what
 * the dashboard calls things — nobody is locked out of anything by answering.
 */
export function AccountTypePicker() {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  async function pick(accountType: 'agency' | 'brand') {
    if (busy) return
    setBusy(accountType)
    setError('')
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountType }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Couldn’t save that')
      // The answer rewrites this page's own headings and buttons, and it is
      // answered once per account — so reload rather than refresh the router,
      // which leaves a same-route server render showing the old wording.
      window.location.assign('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save that')
      setBusy('')
    }
  }

  const options = [
    {
      id: 'agency' as const,
      title: 'I run a studio or agency',
      body: 'A hub per client, plus one for your own brand. Client links get signed with your studio’s name.',
    },
    {
      id: 'brand' as const,
      title: 'I look after one brand',
      body: 'One hub that is your brand — the place you send teammates, freelancers, press and printers for files.',
    },
  ]

  return (
    <section>
      <h1 className="text-[24px] font-bold tracking-tight mb-1">What are you setting up?</h1>
      <p className="text-[13.5px] text-muted-foreground mb-6">
        This only changes what things are called. You can keep as many hubs as your plan allows either way.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {options.map(option => (
          <Button
            key={option.id}
            variant="outline"
            onClick={() => pick(option.id)}
            disabled={Boolean(busy)}
            className="h-auto flex-col items-start gap-0 text-left whitespace-normal p-6"
          >
            <p className="text-[16px] font-semibold text-foreground mb-1.5">{option.title}</p>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed">{option.body}</p>
            <p className="text-[12px] font-semibold text-foreground mt-4">
              {busy === option.id ? 'Setting up…' : 'Choose this →'}
            </p>
          </Button>
        ))}
      </div>
      {error && <p className="text-[12.5px] text-destructive mt-3">{error}</p>}
    </section>
  )
}

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
