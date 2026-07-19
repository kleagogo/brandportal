'use client'

import { useState } from 'react'

/** Branded gate a viewer sees when a hub is PIN-protected. */
export function PinGate({ slug, name, logoUrl }: { slug: string; name: string; logoUrl?: string }) {
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy || pin.length < 4) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/hubs/${encodeURIComponent(slug)}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Wrong PIN')
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wrong PIN')
      setBusy(false)
      setPin('')
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f9f8] flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-[320px] text-center">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={name} className="w-14 h-14 object-contain mx-auto mb-4" />
        ) : (
          <div className="w-14 h-14 bg-[#1a1a1a] rounded-xl mx-auto mb-4" />
        )}
        <h1 className="text-[19px] font-bold tracking-tight mb-1">{name}</h1>
        <p className="text-[13px] text-[#8a8a85] mb-6">This brand hub is protected — enter the PIN you were given.</p>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={8}
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="····"
          autoFocus
          className="w-40 mx-auto text-center text-[26px] font-semibold tracking-[0.4em] px-4 py-3 rounded-xl border-[1.5px] border-[#e8e7e4] bg-white outline-none focus:border-[#1a1a1a] transition-colors placeholder:text-[#d5d4cf] mb-3 block"
        />
        {error && <p className="text-[12.5px] text-red-500 mb-3">{error}</p>}
        <button
          type="submit"
          disabled={busy || pin.length < 4}
          className="w-40 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-semibold rounded-xl hover:bg-[#333] transition-colors disabled:opacity-40"
        >
          {busy ? 'Checking…' : 'Open hub'}
        </button>
      </form>
    </div>
  )
}
