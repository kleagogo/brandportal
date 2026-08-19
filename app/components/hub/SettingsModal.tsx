'use client'

import { useEffect, useRef, useState } from 'react'
import { useHub } from './HubContext'
import { Icon } from './Icon'
import { localPreview, uploadAsset } from './upload-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator,
} from '@/components/ui/field'
import { useConfirm } from './useConfirm'
import { AccessSection } from './AccessSection'
import { Progress } from '@/components/ui/progress'
import { quotaState } from '@/lib/quota'
import { humanSize } from './upload-client'

/**
 * Owner-only hub settings.
 *
 * A studio hub and a client space are not the same object wearing different
 * labels. The studio is the agency's own brand and the account's root: it has
 * no client to be named after, nobody to be handed to, and deleting it would
 * take the thing every client space is copied from. It gets its own identity
 * fields instead.
 *
 * Built from the library's own Dialog and Field pieces. The hand-rolled panel
 * this replaces set its own paddings and label sizes per row, which is where
 * the misalignments came from — every field had drifted a little differently.
 */
export function SettingsModal({ onClose, studio = false }: { onClose: () => void; studio?: boolean }) {
  const { config, sandbox, update } = useHub()
  const logoInput = useRef<HTMLInputElement>(null)
  const [logoBusy, setLogoBusy] = useState(false)
  const { confirm, confirmDialog } = useConfirm()
  const [slug, setSlug] = useState(config.slug)
  const [client, setClient] = useState('')
  const [clientSaved, setClientSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const storage = quotaState(config)

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

  return (
    <Dialog open onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[440px]">
        {confirmDialog}
        <DialogHeader>
          <DialogTitle>Hub settings</DialogTitle>
          <DialogDescription>
            {sandbox ? 'Try it. Nothing here is saved.' : 'Only you, the owner, can see this.'}
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-6">
          {/* Somewhere to look before the upload that doesn't fit, rather than
              after it. */}
          <Field>
            <FieldLabel>Storage</FieldLabel>
            <Progress value={storage.percent} />
            <FieldDescription>
              {humanSize(storage.used)} of {humanSize(storage.quota)} used
              {storage.percent >= 80 ? ' — running low. Ask us for more room any time.' : ''}
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="hub-logo">Logo</FieldLabel>
            <div className="flex items-center gap-3">
              {/* The mark itself is a picture, not a control. */}
              <Avatar className="size-14 rounded-xl">
                <AvatarImage src={config.logoUrl || undefined} alt="" className="rounded-xl object-contain p-1" />
                <AvatarFallback className="rounded-xl border border-dashed border-muted-foreground/40 bg-transparent text-muted-foreground">
                  <Icon name="logo" size={16} />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1.5">
                <Button id="hub-logo" size="sm" variant="outline" disabled={logoBusy} onClick={() => logoInput.current?.click()}>
                  {logoBusy ? 'Uploading…' : config.logoUrl ? 'Replace' : 'Upload a logo'}
                </Button>
                {config.logoUrl && (
                  <Button size="sm" variant="ghost" onClick={() => update(c => { c.logoUrl = '' })}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <FieldDescription>
              Shown in the sidebar and on every share link. A square mark works best.
            </FieldDescription>
            <input
              ref={logoInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) pickLogo(f); e.target.value = '' }}
            />
          </Field>

          {studio ? (
            <>
              <Field>
                <FieldLabel htmlFor="studio-name">Studio name</FieldLabel>
                <Input
                  id="studio-name"
                  value={config.name}
                  onChange={e => update(c => { c.name = e.target.value })}
                  placeholder="e.g. Studio North"
                />
                <FieldDescription>Your agency, as it appears in the sidebar and on share links.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="studio-tagline">Subheader</FieldLabel>
                <Input
                  id="studio-tagline"
                  value={config.tagline}
                  onChange={e => update(c => { c.tagline = e.target.value })}
                  placeholder="e.g. Brand and identity, from the harbour up"
                />
                <FieldDescription>One line under the name. Left empty, nothing shows.</FieldDescription>
              </Field>
            </>
          ) : (
            <Field>
              <FieldLabel htmlFor="client-name">Client name</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="client-name"
                  value={client}
                  onChange={e => setClient(e.target.value)}
                  onBlur={saveClient}
                  placeholder="e.g. Copperline Coffee"
                  className="flex-1"
                />
                <Button variant="outline" onClick={saveClient}>
                  {clientSaved ? 'Saved' : 'Save'}
                </Button>
              </div>
              <FieldDescription>Shown on your client-spaces dashboard.</FieldDescription>
            </Field>
          )}

          {/* Who gets in, and who can change things. These were inside the
              Share dialog, where nobody looking for a password would think to
              press. */}
          {!sandbox && (
            <>
              <FieldSeparator />
              <AccessSection onError={setError} />
              <FieldSeparator />
            </>
          )}

          <form onSubmit={rename}>
            <Field>
              <FieldLabel htmlFor="hub-slug">Hub address</FieldLabel>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-[13px] text-muted-foreground/60">/</span>
                  <Input
                    id="hub-slug"
                    value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="pl-6 font-mono"
                  />
                </div>
                <Button type="submit" disabled={busy || slug.trim() === config.slug}>
                  Change
                </Button>
              </div>
              <FieldDescription>Changing the address breaks previously shared links.</FieldDescription>
            </Field>
          </form>

          {error && <p className="text-[12.5px] text-destructive">{error}</p>}

          {/* Handing the hub to someone else and deleting it are the two things
              a sandbox cannot honestly offer: they are irreversible, they
              belong to an owner, and the demo has none. The rest of this panel
              is safe to try, so the demo shows it. */}
          {!sandbox && !studio && (
            <>
              <FieldSeparator />
              <TransferSection slug={config.slug} name={config.name} />
              <FieldSeparator />
              <Field orientation="horizontal">
                <div className="flex-1">
                  <FieldLabel>Delete this hub</FieldLabel>
                  <FieldDescription>Removes the hub and its share link forever.</FieldDescription>
                </div>
                <Button variant="destructive" disabled={busy} onClick={destroy}>
                  Delete hub
                </Button>
              </Field>
            </>
          )}
        </FieldGroup>
      </DialogContent>
    </Dialog>
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
    <Field>
      {confirmDialog}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <FieldLabel>Hand off to a client</FieldLabel>
          <FieldDescription>Transfer ownership. They accept by email and you stay on as an editor.</FieldDescription>
        </div>
        {!open && !sentTo && (
          <Button variant="outline" onClick={() => setOpen(true)}>
            Transfer…
          </Button>
        )}
      </div>

      {sentTo ? (
        <div className="rounded-lg bg-muted p-3">
          <p className="text-[12px] text-muted-foreground">
            Transfer offer sent to <b>{sentTo}</b>. The hub stays yours until they accept.
          </p>
          {devLink && (
            <button
              onClick={() => navigator.clipboard.writeText(devLink)}
              className="mt-1 text-[12px] font-semibold text-foreground underline underline-offset-2"
            >
              Copy their accept link (email not configured)
            </button>
          )}
        </div>
      ) : open && (
        <form onSubmit={transfer} className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="client@theircompany.com"
            required
            autoFocus
            className="flex-1"
          />
          <Button type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send offer'}
          </Button>
        </form>
      )}
      {error && <p className="text-[12px] text-destructive">{error}</p>}
    </Field>
  )
}
