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
      <div className="relative bg-white rounded-2xl border border-[#e8e7e4] shadow-2xl w-full max-w-[440px] p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#b0afa9] hover:text-[#1a1a1a] transition-colors" title="Close">
          <Icon name="close" size={14} />
        </button>

        <h2 className="text-[17px] font-bold tracking-tight mb-1">Hub settings</h2>
        <p className="text-[13px] text-[#8a8a85] mb-5">Only you, the owner, can see this.</p>

        <form onSubmit={rename} className="mb-6">
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#b0afa9] mb-1.5">Hub address</label>
          <div className="flex gap-2">
            <div className="flex items-center flex-1 rounded-xl border-[1.5px] border-[#e8e7e4] focus-within:border-[#1a1a1a] transition-colors overflow-hidden">
              <span className="pl-3 text-[13px] text-[#b0afa9] font-mono">/</span>
              <input
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                className="flex-1 px-1 py-2.5 text-[13px] font-mono outline-none min-w-0"
              />
            </div>
            <button
              type="submit"
              disabled={busy || slug.trim() === config.slug}
              className="text-[13px] font-semibold bg-[#1a1a1a] text-white px-4 py-2.5 rounded-xl hover:bg-[#333] transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              Change
            </button>
          </div>
          <p className="text-[11.5px] text-[#b0afa9] mt-1.5">Changing the address breaks previously shared links.</p>
        </form>

        {error && <p className="text-[12.5px] text-red-500 mb-4">{error}</p>}

        <div className="border-t border-dashed border-[#e8e7e4] pt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-[#1a1a1a]">Delete this hub</p>
            <p className="text-[12px] text-[#b0afa9]">Removes the hub and its share link forever</p>
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
