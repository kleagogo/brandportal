'use client'

import { useCallback, useEffect, useState } from 'react'
import { useHub } from './HubContext'
import { DatePicker } from './DatePicker'
import { Icon } from './Icon'
import { Toggle } from '../transitions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'

/**
 * Who can open this hub, and who can change it.
 *
 * These lived inside the Share dialog, which reads as "send this to a client"
 * — so the answer to "how do I put a password on this" sat behind a button
 * nobody looking for it would press. They belong with the hub's other
 * settings; sharing is what you do once they're set.
 *
 * It owns its own fetch rather than taking state from a parent, so it can sit
 * in any panel without that panel having to know about PINs.
 */
export function AccessSection({ onError }: { onError?: (message: string) => void }) {
  const { config } = useHub()
  const [loaded, setLoaded] = useState(false)
  const [pin, setPin] = useState<string | null>(null)
  const [pinDraft, setPinDraft] = useState('')
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [editors, setEditors] = useState<string[]>([])
  const [pending, setPending] = useState<string[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [inviteSentTo, setInviteSentTo] = useState('')
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/hubs/${encodeURIComponent(config.slug)}/settings`)
      if (!res.ok) return
      const data = await res.json()
      setPin(data.pin)
      setPinDraft(data.pin || '')
      setExpiresAt(data.expiresAt || null)
      setEditors(data.editors || [])
      setPending(data.pendingInvites || [])
      setLoaded(true)
    } catch { /* the section stays hidden rather than showing half a state */ }
  }, [config.slug])

  useEffect(() => { load() }, [load])

  async function save(patch: Record<string, unknown>) {
    const res = await fetch(`/api/hubs/${encodeURIComponent(config.slug)}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json()
    if (!res.ok) { onError?.(data.error || 'Couldn’t save that'); return null }
    return data
  }

  async function togglePin() {
    const next = pin ? null : String(Math.floor(1000 + Math.random() * 9000))
    const data = await save({ pin: next })
    if (data) { setPin(data.pin); setPinDraft(data.pin || '') }
  }

  async function savePassword() {
    const value = pinDraft.trim()
    if (value === (pin || '')) return
    const data = await save({ pin: value.length >= 4 ? value : null })
    if (data) { setPin(data.pin); setPinDraft(data.pin || '') }
  }

  async function saveExpiry(value: string) {
    const iso = value ? new Date(`${value}T23:59:59`).toISOString() : null
    const data = await save({ expiresAt: iso })
    if (data) setExpiresAt(iso)
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim() || inviteBusy) return
    setInviteBusy(true)
    setInviteLink('')
    try {
      const res = await fetch(`/api/hubs/${encodeURIComponent(config.slug)}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Couldn’t send the invite')
      setInviteSentTo(data.email)
      setInviteLink(data.devLink || '')
      setInviteEmail('')
      load()
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Couldn’t send the invite')
    } finally {
      setInviteBusy(false)
    }
  }

  async function removeEditor(email: string) {
    const res = await fetch(`/api/hubs/${encodeURIComponent(config.slug)}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ removeEditor: email }),
    })
    if (res.ok) setEditors(list => list.filter(e => e !== email))
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (!loaded) return null

  return (
    <>
      <Field>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <FieldLabel>Password protection</FieldLabel>
            <FieldDescription>
              {pin ? 'Viewers must enter it to open the hub' : 'Anyone with the link can view'}
            </FieldDescription>
          </div>
          <Toggle on={Boolean(pin)} onChange={togglePin} label={pin ? 'Turn protection off' : 'Turn protection on'} />
        </div>
        {pin && (
          <div className="flex gap-2">
            <Input
              value={pinDraft}
              onChange={e => setPinDraft(e.target.value)}
              onBlur={savePassword}
              onKeyDown={e => { if (e.key === 'Enter') savePassword() }}
              placeholder="PIN or password"
              className="flex-1 font-mono"
            />
            <Button variant="outline" onClick={() => copy(pinDraft)}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        )}
      </Field>

      <Field>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <FieldLabel>Link expires</FieldLabel>
            <FieldDescription>
              {expiresAt ? `Stops working ${new Date(expiresAt).toLocaleDateString()}` : 'Never expires'}
            </FieldDescription>
          </div>
          <div className="shrink-0">
            <DatePicker
              value={expiresAt || null}
              onChange={iso => saveExpiry(iso ? iso.slice(0, 10) : '')}
              placeholder="Never"
            />
          </div>
        </div>
      </Field>

      <Field>
        <FieldLabel htmlFor="invite-editor">Editors</FieldLabel>
        <FieldDescription>They can add and change files in this hub. They can&rsquo;t delete it.</FieldDescription>
        <form onSubmit={invite} className="flex gap-2">
          <Input
            id="invite-editor"
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="flex-1"
          />
          <Button type="submit" variant="outline" disabled={inviteBusy}>
            {inviteBusy ? 'Inviting…' : 'Invite'}
          </Button>
        </form>

        {inviteSentTo && (
          <div className="rounded-lg bg-muted p-3">
            <p className="text-[12px] text-muted-foreground">
              Invite sent to <b>{inviteSentTo}</b>.
            </p>
            {inviteLink && (
              <button
                onClick={() => copy(inviteLink)}
                className="mt-1 text-[12px] font-semibold underline underline-offset-2"
              >
                Copy their link (email not configured)
              </button>
            )}
          </div>
        )}

        {(editors.length > 0 || pending.length > 0) && (
          <div className="flex flex-col gap-1">
            {editors.map(email => (
              <div key={email} className="flex items-center justify-between gap-2 text-[13px]">
                <span className="truncate">{email}</span>
                <Button
                  size="xs"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeEditor(email)}
                >
                  <Icon name="close" size={11} /> Remove
                </Button>
              </div>
            ))}
            {pending.map(email => (
              <div key={email} className="flex items-center justify-between gap-2 text-[13px] text-muted-foreground">
                <span className="truncate">{email}</span>
                <span className="text-[11px]">Invited</span>
              </div>
            ))}
          </div>
        )}
      </Field>
    </>
  )
}
