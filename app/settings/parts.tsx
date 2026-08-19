'use client'

import { useEffect, useState } from 'react'
import { useConfirm } from '@/app/components/hub/useConfirm'

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
    return <p className="text-[12.5px] text-primary font-medium">Email updated ✓</p>
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-[13px] font-medium text-foreground underline underline-offset-2 hover:text-muted-foreground">
        Change email
      </button>
    )
  }

  if (state === 'sent') {
    return (
      <div className="bg-muted rounded-xl p-3">
        <p className="text-[12.5px] text-muted-foreground">
          Confirmation sent to <b>{email}</b>. Click the link there to switch.
        </p>
        {devLink && (
          <a href={devLink} className="text-[12.5px] font-semibold text-foreground underline underline-offset-2">
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
        className="flex-1 min-w-[200px] text-[13px] px-3 py-2 rounded-xl border-[1.5px] border-border outline-none focus:border-ring transition-colors placeholder:text-muted-foreground/60"
      />
      <button
        type="submit"
        disabled={state === 'sending'}
        className="text-[13px] font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {state === 'sending' ? 'Sending…' : 'Send confirmation'}
      </button>
      {error && <p className="text-[12px] text-destructive w-full">{error}</p>}
    </form>
  )
}

export function LeaveHubButton({ slug, name }: { slug: string; name: string }) {
  const { confirm, confirmDialog } = useConfirm()
  const [busy, setBusy] = useState(false)

  async function leave() {
    const ok = await confirm({
      title: `Leave "${name}"?`,
      description: 'You’ll lose edit access until someone invites you back.',
      confirmLabel: 'Leave hub',
      destructive: true,
    })
    if (!ok) return
    setBusy(true)
    const res = await fetch(`/api/hubs/${encodeURIComponent(slug)}/leave`, { method: 'POST' })
    if (res.ok) window.location.reload()
    else setBusy(false)
  }

  return (
    <>
      {confirmDialog}
      <button onClick={leave} disabled={busy} className="text-[12px] text-muted-foreground/60 hover:text-destructive transition-colors disabled:opacity-50">
        Leave
      </button>
    </>
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
      className="text-[13px] font-semibold text-destructive border-[1.5px] border-destructive/30 px-3.5 py-2 rounded-xl hover:bg-destructive/10 transition-colors disabled:opacity-50"
    >
      {busy ? 'Deleting…' : 'Delete my account'}
    </button>
  )
}

/**
 * The account's team.
 *
 * A teammate added here reaches every hub the account owns, including ones
 * created later — which is the whole point. Per-hub editors still exist for
 * the narrower case: giving one client's contact access to their space alone.
 */
export function TeamMembers() {
  const [members, setMembers] = useState<string[]>([])
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const { confirm, confirmDialog } = useConfirm()

  useEffect(() => {
    fetch('/api/account/team')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) setMembers(d.members || []) })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/account/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Couldn’t add them')
      setMembers(data.members || [])
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t add them')
    } finally {
      setBusy(false)
    }
  }

  async function remove(target: string) {
    const ok = await confirm({
      title: `Remove ${target}?`,
      description: 'They lose access to every hub on this account, including any they were invited to individually.',
      confirmLabel: 'Remove',
      destructive: true,
    })
    if (!ok) return
    const res = await fetch('/api/account/team', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: target }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) setMembers(data.members || [])
    else setError(data.error || 'Couldn’t remove them')
  }

  if (!loaded) return null

  return (
    <>
      {confirmDialog}
      <form onSubmit={add} className="flex gap-2 mb-3">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="colleague@yourstudio.com"
          className="flex-1 text-[13px] px-3 py-2 rounded-xl border-[1.5px] border-border outline-none focus:border-ring transition-colors placeholder:text-muted-foreground/60"
        />
        <button
          type="submit"
          disabled={busy}
          className="text-[13px] font-semibold border-[1.5px] border-foreground text-foreground px-3.5 py-2 rounded-xl hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {busy ? 'Adding…' : 'Add'}
        </button>
      </form>

      {members.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          Just you. Anyone you add here can edit every hub on the account.
        </p>
      ) : (
        <div className="space-y-1">
          {members.map(m => (
            <div key={m} className="flex items-center justify-between gap-3 py-1">
              <span className="text-[14px] text-foreground truncate">{m}</span>
              <button
                onClick={() => remove(m)}
                className="text-[12px] text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-[12.5px] text-destructive mt-2">{error}</p>}
    </>
  )
}
