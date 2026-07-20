'use client'

import { useState } from 'react'
import { useHub } from './HubContext'
import { Icon } from './Icon'

/** Owner-only hub settings: address and deletion. */
export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { config } = useHub()
  const [slug, setSlug] = useState(config.slug)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function rename(e: React.FormEvent) {
    e.preventDefault()
    if (busy || slug.trim() === config.slug) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/hubs/${encodeURIComponent(config.slug)}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newSlug: slug.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Couldn’t change the address')
      window.location.href = `/${data.slug}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t change the address')
      setBusy(false)
    }
  }

  async function destroy() {
    if (!window.confirm(`Delete the "${config.name}" hub permanently? This can’t be undone.`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/hubs/${encodeURIComponent(config.slug)}/settings`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      window.location.href = '/dashboard'
    } catch {
      setError('Couldn’t delete the hub')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-[var(--hub-panel)] rounded-2xl border border-[var(--hub-border)] shadow-2xl w-full max-w-[440px] p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--hub-faint)] hover:text-[var(--hub-text)] transition-colors" title="Close">
          <Icon name="close" size={14} />
        </button>

        <h2 className="text-[17px] font-bold tracking-tight mb-1">Hub settings</h2>
        <p className="text-[13px] text-[var(--hub-muted)] mb-5">Only you, the owner, can see this.</p>

        <form onSubmit={rename} className="mb-6">
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-[var(--hub-faint)] mb-1.5">Hub address</label>
          <div className="flex gap-2">
            <div className="flex items-center flex-1 rounded-xl border-[1.5px] border-[var(--hub-border)] focus-within:border-[var(--hub-text)] transition-colors overflow-hidden">
              <span className="pl-3 text-[13px] text-[var(--hub-faint)] font-mono">/</span>
              <input
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                className="flex-1 px-1 py-2.5 text-[13px] font-mono outline-none min-w-0"
              />
            </div>
            <button
              type="submit"
              disabled={busy || slug.trim() === config.slug}
              className="text-[13px] font-semibold bg-[var(--hub-btn)] text-[var(--hub-btn-text)] px-4 py-2.5 rounded-xl hover:opacity-85 transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              Change
            </button>
          </div>
          <p className="text-[11.5px] text-[var(--hub-faint)] mt-1.5">Changing the address breaks previously shared links.</p>
        </form>

        {error && <p className="text-[12.5px] text-red-500 mb-4">{error}</p>}

        <TransferSection slug={config.slug} name={config.name} />

        <div className="border-t border-dashed border-[var(--hub-border)] pt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-[var(--hub-text)]">Delete this hub</p>
            <p className="text-[12px] text-[var(--hub-faint)]">Removes the hub and its share link forever</p>
          </div>
          <button
            onClick={destroy}
            disabled={busy}
            className="text-[13px] font-semibold text-red-600 border-[1.5px] border-red-200 px-3.5 py-2 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            Delete hub
          </button>
        </div>
      </div>
    </div>
  )
}

/** Hand the hub to a client or teammate — the agency handoff moment. */
function TransferSection({ slug, name }: { slug: string; name: string }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [devLink, setDevLink] = useState('')
  const [error, setError] = useState('')

  async function transfer(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || busy) return
    if (!window.confirm(`Transfer ownership of "${name}" to ${email.trim()}? Once they accept, they own it and you become an editor.`)) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/hubs/${encodeURIComponent(slug)}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferTo: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Couldn’t start the transfer')
      setSentTo(data.transfer)
      setDevLink(data.devLink || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t start the transfer')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border-t border-dashed border-[var(--hub-border)] pt-4 mb-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-[var(--hub-text)]">Hand off to a client</p>
          <p className="text-[12px] text-[var(--hub-faint)]">Transfer ownership — they accept by email, you stay on as an editor</p>
        </div>
        {!open && !sentTo && (
          <button onClick={() => setOpen(true)} className="text-[13px] font-semibold border-[1.5px] border-[var(--hub-border)] text-[var(--hub-text)] px-3.5 py-2 rounded-xl hover:border-[var(--hub-text)] transition-colors whitespace-nowrap">
            Transfer…
          </button>
        )}
      </div>

      {sentTo ? (
        <div className="bg-[var(--hub-soft)] rounded-xl p-3 mt-3">
          <p className="text-[12px] text-[var(--hub-muted)]">
            Transfer offer sent to <b>{sentTo}</b>. The hub stays yours until they accept.
          </p>
          {devLink && (
            <button
              onClick={() => navigator.clipboard.writeText(devLink)}
              className="text-[12px] font-semibold text-[var(--hub-text)] underline underline-offset-2 mt-1"
            >
              Copy their accept link (email not configured)
            </button>
          )}
        </div>
      ) : open && (
        <form onSubmit={transfer} className="flex gap-2 mt-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="client@theircompany.com"
            required
            autoFocus
            className="flex-1 text-[13px] px-3 py-2 rounded-xl border-[1.5px] border-[var(--hub-border)] outline-none focus:border-[var(--hub-text)] transition-colors placeholder:text-[var(--hub-faint)]"
          />
          <button
            type="submit"
            disabled={busy}
            className="text-[13px] font-semibold bg-[var(--hub-btn)] text-[var(--hub-btn-text)] px-3.5 py-2 rounded-xl hover:opacity-85 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {busy ? 'Sending…' : 'Send offer'}
          </button>
        </form>
      )}
      {error && <p className="text-[12px] text-red-500 mt-2">{error}</p>}
    </div>
  )
}
