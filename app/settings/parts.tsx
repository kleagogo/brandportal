'use client'

import { useEffect, useState } from 'react'

export function ChangeEmail() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [devLink, setDevLink] = useState('')
  const [error, setError] = useState('')
  const [changed, setChanged] = useState(false)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('email-changed')) setChanged(true)
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || state === 'sending') return
    setState('sending')
    setError('')
    try {
      const res = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setDevLink(data.devLink || '')
      setState('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('idle')
    }
  }

  if (changed) {
    return <p className="text-[12.5px] text-emerald-600 font-medium">Email updated ✓</p>
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-[13px] font-medium text-[#1a1a1a] underline underline-offset-2 hover:text-[#555]">
        Change email
      </button>
    )
  }

  if (state === 'sent') {
    return (
      <div className="bg-[#f5f5f3] rounded-xl p-3">
        <p className="text-[12.5px] text-[#6b6b66]">
          Confirmation sent to <b>{email}</b> — click the link there to switch.
        </p>
        {devLink && (
          <a href={devLink} className="text-[12.5px] font-semibold text-[#1a1a1a] underline underline-offset-2">
            Open confirmation link →
          </a>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex gap-2 flex-wrap">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="new@email.com"
        required
        autoFocus
        className="flex-1 min-w-[200px] text-[13px] px-3 py-2 rounded-xl border-[1.5px] border-[#e8e7e4] outline-none focus:border-[#1a1a1a] transition-colors placeholder:text-[#b0afa9]"
      />
      <button
        type="submit"
        disabled={state === 'sending'}
        className="text-[13px] font-semibold bg-[#1a1a1a] text-white px-4 py-2 rounded-xl hover:bg-[#333] transition-colors disabled:opacity-60"
      >
        {state === 'sending' ? 'Sending…' : 'Send confirmation'}
      </button>
      {error && <p className="text-[12px] text-red-500 w-full">{error}</p>}
    </form>
  )
}

export function LeaveHubButton({ slug, name }: { slug: string; name: string }) {
  const [busy, setBusy] = useState(false)

  async function leave() {
    if (!window.confirm(`Leave "${name}"? You’ll lose edit access until re-invited.`)) return
    setBusy(true)
    const res = await fetch(`/api/hubs/${encodeURIComponent(slug)}/leave`, { method: 'POST' })
    if (res.ok) window.location.reload()
    else setBusy(false)
  }

  return (
    <button onClick={leave} disabled={busy} className="text-[12px] text-[#b0afa9] hover:text-red-500 transition-colors disabled:opacity-50">
      Leave
    </button>
  )
}

export function DeleteAccount({ email }: { email: string }) {
  const [busy, setBusy] = useState(false)

  async function destroy() {
    const typed = window.prompt(`This permanently deletes your account and every hub you own.\n\nType your email (${email}) to confirm:`)
    if (typed?.trim().toLowerCase() !== email) return
    setBusy(true)
    const res = await fetch('/api/account', { method: 'DELETE' })
    if (res.ok) window.location.href = '/'
    else setBusy(false)
  }

  return (
    <button
      onClick={destroy}
      disabled={busy}
      className="text-[13px] font-semibold text-red-600 border-[1.5px] border-red-200 px-3.5 py-2 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {busy ? 'Deleting…' : 'Delete my account'}
    </button>
  )
}
