'use client'

import { useState } from 'react'

/** Branded gate a viewer sees when a hub is PIN/password protected or expired. */
export function PinGate({ slug, name, logoUrl, expired }: { slug: string; name: string; logoUrl?: string; expired?: boolean }) {
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy || pin.trim().length < 4) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/hubs/${encodeURIComponent(slug)}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'That didn’t work')
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That didn’t work')
      setBusy(false)
      setPin('')
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-[340px] text-center">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={name} className="w-14 h-14 object-contain mx-auto mb-4" />
        ) : (
          <div className="w-14 h-14 bg-foreground rounded-xl mx-auto mb-4" />
        )}
        <h1 className="text-[19px] font-bold tracking-tight mb-1">{name}</h1>

        {expired ? (
          <p className="text-[13px] text-muted-foreground">
            This share link has expired. Ask whoever sent it for a fresh link.
          </p>
        ) : (
          <form onSubmit={submit}>
            <p className="text-[13px] text-muted-foreground mb-6">
              This brand hub is protected — enter the PIN or password you were given.
            </p>
            <input
              type="password"
              autoComplete="off"
              maxLength={64}
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="••••"
              autoFocus
              className="w-full text-center text-[18px] tracking-widest px-4 py-3 rounded-xl border-[1.5px] border-border bg-card outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/60 mb-3 block"
            />
            {error && <p className="text-[12.5px] text-destructive mb-3">{error}</p>}
            <button
              type="submit"
              disabled={busy || pin.trim().length < 4}
              className="w-full py-2.5 bg-primary text-primary-foreground text-[13px] font-semibold rounded-xl hover:opacity-85 transition-colors disabled:opacity-40"
            >
              {busy ? 'Checking…' : 'Open hub'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
