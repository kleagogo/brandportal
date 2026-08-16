'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
      <p className="text-[13.5px] text-[#8a8a85] mb-6">
        This only changes what things are called. You can keep as many hubs as your plan allows either way.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {options.map(option => (
          <button
            key={option.id}
            onClick={() => pick(option.id)}
            disabled={Boolean(busy)}
            className="text-left bg-white border border-[#e8e7e4] rounded-2xl p-6 hover:border-[#1a1a1a] transition-colors disabled:opacity-60"
          >
            <p className="text-[16px] font-semibold text-[#1a1a1a] mb-1.5">{option.title}</p>
            <p className="text-[13.5px] text-[#6b6b66] leading-relaxed">{option.body}</p>
            <p className="text-[12px] font-semibold text-[#1a1a1a] mt-4">
              {busy === option.id ? 'Setting up…' : 'Choose this →'}
            </p>
          </button>
        ))}
      </div>
      {error && <p className="text-[12.5px] text-red-500 mt-3">{error}</p>}
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
    <form onSubmit={create} className="bg-white border border-[#e8e7e4] rounded-2xl p-6">
      <p className="text-[16px] font-semibold text-[#1a1a1a] mb-1">{labels.setupTitle}</p>
      <p className="text-[13.5px] text-[#8a8a85] leading-relaxed mb-5 max-w-[58ch]">{labels.setupBody}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={labels.setupPlaceholder}
          aria-label={labels.setupPlaceholder}
          className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border-[1.5px] border-[#e8e7e4] text-[14px] outline-none focus:border-[#1a1a1a] transition-colors placeholder:text-[#b0afa9]"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="text-[13px] font-semibold bg-[#1a1a1a] text-white px-4 py-2.5 rounded-xl hover:bg-[#333] transition-colors disabled:opacity-40"
        >
          {busy ? 'Creating…' : labels.setupAction}
        </button>
      </div>
      {error && <p className="text-[12.5px] text-red-500 mt-3">{error}</p>}
    </form>
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
      <button
        onClick={() => setOpen(true)}
        className="text-[13px] font-semibold bg-[#1a1a1a] text-white px-4 py-2.5 rounded-xl hover:bg-[#333] transition-colors"
      >
        {labels.newButton}
      </button>
    )
  }

  return (
    <form onSubmit={create} className="flex items-center gap-2 flex-wrap justify-end">
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Escape' && setOpen(false)}
        placeholder={labels.namePlaceholder}
        aria-label={labels.namePlaceholder}
        autoFocus
        className="px-3.5 py-2.5 rounded-xl border-[1.5px] border-[#e8e7e4] text-[14px] outline-none focus:border-[#1a1a1a] transition-colors placeholder:text-[#b0afa9]"
      />
      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="text-[13px] font-semibold bg-[#1a1a1a] text-white px-4 py-2.5 rounded-xl hover:bg-[#333] transition-colors disabled:opacity-40"
      >
        {busy ? 'Creating…' : 'Create'}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setError('') }}
        className="text-[13px] text-[#8a8a85] hover:text-[#1a1a1a] px-2 py-2.5 transition-colors"
      >
        Cancel
      </button>
      {error && <p className="text-[12px] text-red-500 w-full text-right">{error}</p>}
    </form>
  )
}

export function AccountMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white text-[13px] font-semibold flex items-center justify-center hover:bg-[#333] transition-colors uppercase"
        title={email}
      >
        {email[0]}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-40 w-56 bg-white border border-[#e8e7e4] rounded-xl shadow-xl p-1.5">
            <p className="px-2.5 py-2 text-[12px] text-[#8a8a85] truncate border-b border-[#f0efec] mb-1">{email}</p>
            <Link href="/settings" className="block px-2.5 py-2 text-[13px] text-[#1a1a1a] hover:bg-[#f5f5f3] rounded-lg transition-colors">
              Account settings
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="w-full text-left px-2.5 py-2 text-[13px] text-[#1a1a1a] hover:bg-[#f5f5f3] rounded-lg transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
