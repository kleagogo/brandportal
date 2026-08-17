'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from './Icon'
import { useModalTransition } from '../transitions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** Starter palettes for a fresh hub. The custom field takes any hex. */
const PRESETS = ['#1a1a1a', '#1e5a42', '#a5502a', '#3a5da8', '#6c4a8c', '#b3323b']

/**
 * Create a client hub without leaving the one you're in: name, a brand color,
 * and you land in the new space.
 */
export function NewSpaceModal({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(true)
  const transition = useModalTransition(open, onClose)
  const router = useRouter()
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESETS[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (busy || !name.trim()) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/hubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), primaryColor: color }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.slug) throw new Error(data?.error || 'Couldn’t create the hub')
      router.push(`/${data.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t create the hub')
      setBusy(false)
    }
  }

  if (!transition.mounted) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className={`absolute inset-0 bg-foreground/30 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
      <div className={`t-modal ${transition.className} relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-[420px] p-6`} role="dialog" aria-modal="true">
        <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-muted-foreground/60 hover:text-foreground transition-colors" title="Close">
          <Icon name="close" size={14} />
        </button>

        <h2 className="text-[17px] font-bold tracking-tight mb-1">New client hub</h2>
        <p className="text-[13px] text-muted-foreground mb-5">Its own address, share link, and palette.</p>

        <form onSubmit={create} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-hub-name">Client name</Label>
            <Input
              id="new-hub-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Copperline Coffee"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-hub-color">Brand color</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESETS.map(hex => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColor(hex)}
                  title={hex}
                  className={`w-7 h-7 rounded-full border transition-shadow ${
                    color === hex ? 'ring-2 ring-ring ring-offset-2 ring-offset-card border-transparent' : 'border-foreground/10'
                  }`}
                  style={{ background: hex }}
                />
              ))}
              <Input
                id="new-hub-color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-24 font-mono text-[12px]"
                aria-label="Custom hex color"
              />
            </div>
            <p className="text-[12px] text-muted-foreground/60">The starter palette builds from this. Change it any time.</p>
          </div>

          {error && <p className="text-[12.5px] text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 mt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy || !name.trim()}>
              {busy ? 'Creating…' : 'Create hub'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
