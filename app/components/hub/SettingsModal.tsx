'use client'

import { useEffect, useRef, useState } from 'react'
import { useHub } from './HubContext'
import { Icon } from './Icon'
import { localPreview, uploadAsset } from './upload-client'
import { Button } from '@/components/ui/button'
import { useConfirm } from './useConfirm'
import { useModalTransition } from '../transitions'

/** Owner-only hub settings: address and deletion. */
export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { config, sandbox, update } = useHub()
  const logoInput = useRef<HTMLInputElement>(null)
  const [logoBusy, setLogoBusy] = useState(false)
  const { confirm, confirmDialog } = useConfirm()
  const [open, setOpen] = useState(true)
  const transition = useModalTransition(open, onClose)
  const [slug, setSlug] = useState(config.slug)
  const [client, setClient] = useState('')
  const [clientSaved, setClientSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/hubs/${encodeURIComponent(config.slug)}/settings`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) setClient(d.client || '') })
      .catch(() => {})
  }, [config.slug])

  async function pickLogo(file: File) {
    setLogoBusy(true)
    try {
      const result = sandbox ? localPreview(file) : await uploadAsset(file, config.slug)
      update(c => { c.logoUrl = result.url })
    } catch {
      // A failed upload leaves the mark as it was.
    } finally {
      setLogoBusy(false)
    }
  }

  async function saveClient() {
    await fetch(`/api/hubs/${encodeURIComponent(config.slug)}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client }),
    })
    setClientSaved(true)
    setTimeout(() => setClientSaved(false), 1500)
  }

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
    const ok = await confirm({
      title: `Delete "${config.name}" permanently?`,
      description: 'The hub and its share links go for good. This can’t be undone.',
      confirmLabel: 'Delete hub',
      destructive: true,
    })
    if (!ok) return
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

  if (!transition.mounted) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className={`absolute inset-0 bg-foreground/30 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
      <div className={`t-modal ${transition.className} relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-[440px] p-6`} role="dialog" aria-modal="true">
        {confirmDialog}
        <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-muted-foreground/60 hover:text-foreground transition-colors" title="Close">
          <Icon name="close" size={14} />
        </button>

        <h2 className="text-[17px] font-bold tracking-tight mb-1">Hub settings</h2>
        <p className="text-[13px] text-muted-foreground mb-5">{sandbox ? 'Try it. Nothing here is saved.' : 'Only you, the owner, can see this.'}</p>

        <div className="mb-6">
          <label className="block text-[13px] font-medium text-muted-foreground mb-1.5">Logo</label>
          <div className="flex items-center gap-3">
            {/* An empty slot that says it is empty. Until now the only way to
                set a hub's logo was a dashed square in the sidebar, visible
                only once you had switched a section into edit mode. */}
            <button
              onClick={() => logoInput.current?.click()}
              title={config.logoUrl ? 'Replace logo' : 'Add a logo'}
              className={`flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl transition-colors ${
                config.logoUrl
                  ? 'border border-border bg-muted'
                  : 'border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-ring hover:text-foreground'
              }`}
            >
              {logoBusy ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : config.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
              ) : (
                <Icon name="upload" size={16} />
              )}
            </button>
            <div className="min-w-0">
              <Button size="sm" variant="outline" onClick={() => logoInput.current?.click()}>
                {config.logoUrl ? 'Replace' : 'Upload a logo'}
              </Button>
              {config.logoUrl && (
                <Button size="sm" variant="ghost" onClick={() => update(c => { c.logoUrl = '' })}>
                  Remove
                </Button>
              )}
              <p className="mt-1.5 text-[11.5px] text-muted-foreground/60">
                Shown in the sidebar and on every share link. A square mark works best.
              </p>
            </div>
          </div>
          <input
            ref={logoInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) pickLogo(f); e.target.value = '' }}
          />
        </div>

        <div className="mb-6">
          <label className="block text-[13px] font-medium text-muted-foreground mb-1.5">Client name</label>
          <div className="flex gap-2">
            <input
              value={client}
              onChange={e => setClient(e.target.value)}
              onBlur={saveClient}
              placeholder="e.g. Copperline Coffee"
              className="flex-1 px-3 py-2.5 text-[13px] rounded-xl border-[1.5px] border-border outline-none focus:border-ring transition-colors placeholder:text-muted-foreground/60"
            />
            <button onClick={saveClient} className="text-[13px] font-semibold px-4 rounded-xl border border-border hover:border-ring transition-colors whitespace-nowrap">
              {clientSaved ? 'Saved ✓' : 'Save'}
            </button>
          </div>
          <p className="text-[11.5px] text-muted-foreground/60 mt-1.5">Shown on your client-spaces dashboard.</p>
        </div>

        <form onSubmit={rename} className="mb-6">
          <label className="block text-[13px] font-medium text-muted-foreground mb-1.5">Hub address</label>
          <div className="flex gap-2">
            <div className="flex items-center flex-1 rounded-xl border-[1.5px] border-border focus-within:border-ring transition-colors overflow-hidden">
              <span className="pl-3 text-[13px] text-muted-foreground/60 font-mono">/</span>
              <input
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                className="flex-1 px-1 py-2.5 text-[13px] font-mono outline-none min-w-0"
              />
            </div>
            <button
              type="submit"
              disabled={busy || slug.trim() === config.slug}
              className="text-[13px] font-semibold bg-primary text-primary-foreground px-4 py-2.5 rounded-xl hover:opacity-85 transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              Change
            </button>
          </div>
          <p className="text-[11.5px] text-muted-foreground/60 mt-1.5">Changing the address breaks previously shared links.</p>
        </form>

        {error && <p className="text-[12.5px] text-destructive mb-4">{error}</p>}

        {/* Handing the hub to someone else and deleting it are the two things a
            sandbox cannot honestly offer: they are irreversible, they belong to
            an owner, and the demo has none. The rest of this panel is safe to
            try, so the demo shows it. */}
        {!sandbox && (
          <>
            <TransferSection slug={config.slug} name={config.name} />

            <div className="border-t border-dashed border-border pt-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-foreground">Delete this hub</p>
                <p className="text-[12px] text-muted-foreground/60">Removes the hub and its share link forever</p>
              </div>
              <button
                onClick={destroy}
                disabled={busy}
                className="text-[13px] font-semibold text-destructive border-[1.5px] border-destructive/30 px-3.5 py-2 rounded-xl hover:bg-destructive/10 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                Delete hub
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** Hand the hub to a client or teammate — the agency handoff moment. */
function TransferSection({ slug, name }: { slug: string; name: string }) {
  const { confirm, confirmDialog } = useConfirm()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [devLink, setDevLink] = useState('')
  const [error, setError] = useState('')

  async function transfer(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || busy) return
    const ok = await confirm({
      title: `Transfer "${name}" to ${email.trim()}?`,
      description: 'Once they accept, they own the hub and you stay on as an editor.',
      confirmLabel: 'Send transfer',
    })
    if (!ok) return
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
    <div className="border-t border-dashed border-border pt-4 mb-6">
      {confirmDialog}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-foreground">Hand off to a client</p>
          <p className="text-[12px] text-muted-foreground/60">Transfer ownership. They accept by email and you stay on as an editor.</p>
        </div>
        {!open && !sentTo && (
          <button onClick={() => setOpen(true)} className="text-[13px] font-semibold border-[1.5px] border-border text-foreground px-3.5 py-2 rounded-xl hover:border-ring transition-colors whitespace-nowrap">
            Transfer…
          </button>
        )}
      </div>

      {sentTo ? (
        <div className="bg-muted rounded-xl p-3 mt-3">
          <p className="text-[12px] text-muted-foreground">
            Transfer offer sent to <b>{sentTo}</b>. The hub stays yours until they accept.
          </p>
          {devLink && (
            <button
              onClick={() => navigator.clipboard.writeText(devLink)}
              className="text-[12px] font-semibold text-foreground underline underline-offset-2 mt-1"
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
            className="flex-1 text-[13px] px-3 py-2 rounded-xl border-[1.5px] border-border outline-none focus:border-ring transition-colors placeholder:text-muted-foreground/60"
          />
          <button
            type="submit"
            disabled={busy}
            className="text-[13px] font-semibold bg-primary text-primary-foreground px-3.5 py-2 rounded-xl hover:opacity-85 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {busy ? 'Sending…' : 'Send offer'}
          </button>
        </form>
      )}
      {error && <p className="text-[12px] text-destructive mt-2">{error}</p>}
    </div>
  )
}
