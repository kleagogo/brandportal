'use client'

import { useState } from 'react'

/** Gate for a password-protected or expired share portal. */
export function PortalGate({ id, name, logoUrl, expired }: { id: string; name: string; logoUrl?: string; expired?: boolean }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy || password.trim().length < 4) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/portals/${encodeURIComponent(id)}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'That didn’t work')
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That didn’t work')
      setBusy(false)
      setPassword('')
    }
  }

  return (
    <div className="hub-light min-h-screen bg-[var(--hub-bg)] text-[var(--hub-text)] flex items-center justify-center px-6">
      <div className="w-full max-w-[340px] text-center">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={name} className="w-14 h-14 object-contain mx-auto mb-4" />
        ) : (
          <div className="w-14 h-14 bg-[var(--hub-text)] rounded-xl mx-auto mb-4" />
        )}
        <h1 className="text-[19px] font-bold tracking-tight mb-1">{name}</h1>

        {expired ? (
          <p className="text-[13px] text-[var(--hub-muted)]">
            This share link has expired. Ask whoever sent it for a fresh one.
          </p>
        ) : (
          <form onSubmit={submit}>
            <p className="text-[13px] text-[var(--hub-muted)] mb-6">
              These brand files are protected — enter the password you were given.
            </p>
            <input
              type="password"
              autoComplete="off"
              maxLength={64}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••"
              autoFocus
              className="w-full text-center text-[18px] tracking-widest px-4 py-3 rounded-xl border-[1.5px] border-[var(--hub-border)] bg-[var(--hub-panel)] outline-none focus:border-[var(--hub-text)] transition-colors placeholder:text-[var(--hub-faint)] mb-3 block"
            />
            {error && <p className="text-[12.5px] text-red-500 mb-3">{error}</p>}
            <button
              type="submit"
              disabled={busy || password.trim().length < 4}
              className="w-full py-2.5 bg-[var(--hub-btn)] text-[var(--hub-btn-text)] text-[13px] font-semibold rounded-xl hover:opacity-85 transition-colors disabled:opacity-40"
            >
              {busy ? 'Checking…' : 'Open'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
