'use client'

import { useState } from 'react'
import type { AccountType } from '@/lib/users'
import { labelsFor } from '@/lib/labels'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TextSwap } from '@/app/components/transitions'

/** Starting palettes, so step two produces a hub with real colour in it. */
const SWATCHES = ['#1c3a4a', '#8b3a2f', '#2f6d4f', '#3b3a6d', '#8a6d1f', '#1a1a1a']

export function Welcome({ accountType }: { accountType: AccountType | null }) {
  const [kind, setKind] = useState<AccountType | null>(accountType)
  const [name, setName] = useState('')
  const [color, setColor] = useState(SWATCHES[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const labels = labelsFor(kind)
  const step = kind ? 2 : 1

  async function choose(next: AccountType) {
    setKind(next)
    setError('')
    // Recorded immediately: refreshing after answering shouldn't ask again.
    try {
      await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountType: next }),
      })
    } catch { /* the answer is still held in state for this session */ }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (busy || !name.trim()) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/hubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), studio: true, primaryColor: color }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.slug) throw new Error(data?.error || 'Couldn’t create your hub')
      // Straight into the hub, which opens on its own dropzone.
      window.location.assign(`/${data.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t create your hub')
      setBusy(false)
    }
  }

  return (
    <div className="w-full max-w-[560px]">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
        <TextSwap>{`Step ${step} of 2`}</TextSwap>
      </p>

      {step === 1 ? (
        <>
          <h1 className="text-[26px] font-bold tracking-tight mb-1">What are you setting up?</h1>
          <p className="text-[14px] text-muted-foreground mb-7">
            This only changes what things are called. Either way you keep as many hubs as your plan allows.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => choose('agency')}
              className="h-auto flex-col items-start gap-0 text-left whitespace-normal p-6"
            >
              <span className="text-[16px] font-semibold mb-1.5">I run a studio or agency</span>
              <span className="text-[13.5px] text-muted-foreground leading-relaxed font-normal">
                A hub per client, plus one for your own brand. Client links get signed with your studio’s name.
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => choose('brand')}
              className="h-auto flex-col items-start gap-0 text-left whitespace-normal p-6"
            >
              <span className="text-[16px] font-semibold mb-1.5">I look after one brand</span>
              <span className="text-[13.5px] text-muted-foreground leading-relaxed font-normal">
                One hub that is your brand — where teammates, freelancers, press and printers get files.
              </span>
            </Button>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-[26px] font-bold tracking-tight mb-1">{labels.setupTitle}</h1>
          <p className="text-[14px] text-muted-foreground mb-7 max-w-[52ch]">{labels.setupBody}</p>

          <Card className="p-6">
            <form onSubmit={create} className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label htmlFor="hub-name">{labels.setupPlaceholder}</Label>
                <Input
                  id="hub-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={labels.setupPlaceholder}
                  autoFocus
                />
              </div>

              <div className="grid gap-2">
                <Label>Brand colour</Label>
                <p className="text-[12.5px] text-muted-foreground -mt-1">
                  Your palette starts here — tints and hover states are derived from it, and you can change
                  any of them later.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {SWATCHES.map(hex => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setColor(hex)}
                      aria-label={hex}
                      aria-pressed={color === hex}
                      className={`size-8 rounded-lg border transition-all ${
                        color === hex ? 'ring-2 ring-ring ring-offset-2 ring-offset-card' : 'border-border'
                      }`}
                      style={{ background: hex }}
                    />
                  ))}
                  <Input
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    aria-label="Brand colour hex"
                    className="w-28 font-mono text-[13px]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={busy || !name.trim()}>
                  {busy ? 'Creating…' : labels.setupAction}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setKind(null); setError('') }}
                >
                  Back
                </Button>
              </div>
              {error && <p className="text-[12.5px] text-destructive">{error}</p>}
            </form>
          </Card>

          <p className="text-[12.5px] text-muted-foreground/60 mt-4">
            Next you’ll drop files in — a folder or a .zip works, and nothing has to be tidy first.
          </p>
        </>
      )}
    </div>
  )
}
