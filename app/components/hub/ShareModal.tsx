'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useHub } from './HubContext'
import { Icon } from './Icon'
import { PortalManager } from './PortalManager'
import { useConfettiBurst } from '../transitions'

export function ShareModal({ onClose, isOwner, canEdit, demo }: { onClose: () => void; isOwner: boolean; canEdit: boolean; demo: boolean }) {
  const { config } = useHub()
  const [copied, setCopied] = useState(false)
  // The handoff is the moment the product exists for the client, so the copy
  // that carries it is the one thing here worth celebrating.
  const stageRef = useRef<HTMLDivElement>(null)
  const confettiCanvas = useRef<HTMLCanvasElement>(null)
  const copyBtn = useRef<HTMLButtonElement>(null)
  const burst = useConfettiBurst(stageRef, confettiCanvas, copyBtn)
  const [url, setUrl] = useState('')

  // Owner-only settings state
  const [pin, setPin] = useState<string | null>(null)
  const [pinDraft, setPinDraft] = useState('')
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [editors, setEditors] = useState<string[]>([])
  const [pending, setPending] = useState<Array<{ token: string; email: string; purpose: string }>>([])
  const [loaded, setLoaded] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [inviteSentTo, setInviteSentTo] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setUrl(`${window.location.origin}/${config.slug}`)
  }, [config.slug])

  const loadSettings = useCallback(async () => {
    if (!isOwner) return
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
    } catch { /* settings stay hidden */ }
  }, [config.slug, isOwner])

  useEffect(() => { loadSettings() }, [loadSettings])

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    burst()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function saveSetting(patch: Record<string, unknown>) {
    setError('')
    const res = await fetch(`/api/hubs/${encodeURIComponent(config.slug)}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Couldn’t save that'); return null }
    return data
  }

  async function togglePin() {
    const next = pin ? null : String(Math.floor(1000 + Math.random() * 9000))
    const data = await saveSetting({ pin: next })
    if (data) { setPin(data.pin); setPinDraft(data.pin || '') }
  }

  async function savePassword() {
    const value = pinDraft.trim()
    if (value === (pin || '')) return
    const data = await saveSetting({ pin: value.length >= 4 ? value : null })
    if (data) { setPin(data.pin); setPinDraft(data.pin || '') }
  }

  async function saveExpiry(value: string) {
    const iso = value ? new Date(`${value}T23:59:59`).toISOString() : null
    const data = await saveSetting({ expiresAt: iso })
    if (data) setExpiresAt(iso)
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim() || inviteBusy) return
    setInviteBusy(true)
    setError('')
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
      loadSettings() // refresh the pending list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t send the invite')
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-[var(--hub-panel)] rounded-2xl border border-[var(--hub-border)] shadow-2xl w-full max-w-[520px] p-6 max-h-[85vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--hub-faint)] hover:text-[var(--hub-text)] transition-colors" title="Close">
          <Icon name="close" size={14} />
        </button>

        <h2 className="text-[17px] font-bold tracking-tight mb-1">Share this hub</h2>
        <p className="text-[13px] text-[var(--hub-muted)] mb-5">Anyone with the link can view — no account needed.</p>

        <div ref={stageRef} className="t-confetti-stage flex gap-2 mb-5">
          <canvas ref={confettiCanvas} className="t-confetti-canvas" aria-hidden="true" />
          <div className="flex-1 px-3 py-2.5 bg-[var(--hub-soft)] rounded-xl text-[13px] font-mono text-[var(--hub-text)] truncate">
            {url || `/${config.slug}`}
          </div>
          <button
            ref={copyBtn}
            onClick={() => copy(url)}
            className="px-4 py-2.5 bg-[var(--hub-btn)] text-[var(--hub-btn-text)] text-[13px] font-semibold rounded-xl hover:opacity-85 transition-colors whitespace-nowrap"
          >
            {copied ? 'Copied ✓' : 'Copy link'}
          </button>
        </div>

        {error && <p className="text-[12.5px] text-red-500 mb-4">{error}</p>}

        <div className="mb-5">
          <PortalManager canEdit={canEdit} />
        </div>

        {isOwner && loaded ? (
          <div className="border-t border-dashed border-[var(--hub-border)] pt-4 space-y-5">
            {/* Password / PIN */}
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium text-[var(--hub-text)]">Password protection</p>
                  <p className="text-[12px] text-[var(--hub-faint)]">
                    {pin ? 'Viewers must enter it to open the hub' : 'Anyone with the link can view'}
                  </p>
                </div>
                <button
                  onClick={togglePin}
                  className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${pin ? 'bg-emerald-500' : 'bg-[var(--hub-soft)]'}`}
                  title={pin ? 'Turn protection off' : 'Turn protection on'}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-[var(--hub-panel)] rounded-full shadow transition-all ${pin ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
              </div>
              {pin && (
                <div className="flex gap-2 mt-2">
                  <input
                    value={pinDraft}
                    onChange={e => setPinDraft(e.target.value)}
                    onBlur={savePassword}
                    onKeyDown={e => { if (e.key === 'Enter') savePassword() }}
                    placeholder="PIN or password"
                    className="flex-1 text-[13px] font-mono px-3 py-2 rounded-xl border-[1.5px] border-[var(--hub-border)] outline-none focus:border-[var(--hub-text)] transition-colors"
                  />
                  <button onClick={() => copy(pinDraft)} className="text-[12px] font-semibold px-3 rounded-xl border border-[var(--hub-border)] hover:border-[var(--hub-text)] transition-colors whitespace-nowrap">
                    {copied ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>
              )}
            </div>

            {/* Expiry */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-[var(--hub-text)]">Link expires</p>
                <p className="text-[12px] text-[var(--hub-faint)]">
                  {expiresAt ? `Stops working ${new Date(expiresAt).toLocaleDateString()}` : 'Never expires'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="date"
                  value={expiresAt ? new Date(expiresAt).toISOString().slice(0, 10) : ''}
                  onChange={e => saveExpiry(e.target.value)}
                  className="text-[12px] px-2.5 py-1.5 rounded-xl border-[1.5px] border-[var(--hub-border)] outline-none focus:border-[var(--hub-text)] transition-colors"
                />
                {expiresAt && (
                  <button onClick={() => saveExpiry('')} className="text-[var(--hub-faint)] hover:text-red-500 transition-colors" title="Remove expiry">
                    <Icon name="close" size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Invites */}
            <div>
              <p className="text-[13px] font-medium text-[var(--hub-text)] mb-1.5">Invite editors</p>
              <form onSubmit={invite} className="flex gap-2 mb-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="flex-1 text-[13px] px-3 py-2 rounded-xl border-[1.5px] border-[var(--hub-border)] outline-none focus:border-[var(--hub-text)] transition-colors placeholder:text-[var(--hub-faint)]"
                />
                <button
                  type="submit"
                  disabled={inviteBusy}
                  className="text-[13px] font-semibold border-[1.5px] border-[var(--hub-text)] text-[var(--hub-text)] px-3.5 py-2 rounded-xl hover:bg-[var(--hub-text)] hover:text-[var(--hub-bg)] transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {inviteBusy ? 'Inviting…' : 'Invite'}
                </button>
              </form>
              {inviteSentTo && (
                <div className="bg-[var(--hub-soft)] rounded-xl p-3 mb-2">
                  <p className="text-[12px] text-[var(--hub-muted)] mb-1.5">
                    {inviteLink
                      ? <>Invite created for <b>{inviteSentTo}</b>. Email isn’t configured yet — copy the invite link and send it yourself:</>
                      : <>Invite emailed to <b>{inviteSentTo}</b>.</>}
                  </p>
                  {inviteLink && (
                    <button
                      onClick={() => copy(inviteLink)}
                      className="text-[12px] font-semibold text-[var(--hub-text)] underline underline-offset-2"
                    >
                      {copied ? 'Copied ✓' : 'Copy invite link'}
                    </button>
                  )}
                </div>
              )}
              {(editors.length > 0 || pending.length > 0) && (
                <div className="space-y-1">
                  {editors.map(email => (
                    <div key={email} className="flex items-center justify-between text-[12.5px] text-[var(--hub-muted)] px-1 py-1 group">
                      <span className="truncate">✎ {email}</span>
                      <button
                        onClick={() => removeEditor(email)}
                        className="text-[var(--hub-faint)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove editor"
                      >
                        <Icon name="close" size={11} />
                      </button>
                    </div>
                  ))}
                  {pending.map(p => (
                    <div key={p.token} className="flex items-center justify-between text-[12.5px] text-[var(--hub-faint)] px-1 py-1 group">
                      <span className="truncate">✉ {p.email} · invited, not yet accepted</span>
                      <button
                        onClick={async () => {
                          await fetch(`/api/hubs/${encodeURIComponent(config.slug)}/settings`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ revokeInvite: p.token }),
                          })
                          setPending(list => list.filter(x => x.token !== p.token))
                        }}
                        className="text-[var(--hub-faint)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        title="Revoke invite"
                      >
                        <Icon name="close" size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="border-t border-dashed border-[var(--hub-border)] pt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-[var(--hub-text)]">PIN protection & editor invites</p>
                <p className="text-[12px] text-[var(--hub-faint)]">
                  {demo ? 'Not available on the demo hub — claim your own to use these' : 'Only the hub owner can manage access'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-[var(--hub-text)]">Custom domain</p>
                <p className="text-[12px] text-[var(--hub-faint)]">brand.yourcompany.com</p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#d96e30] bg-[#f7e1d3] px-2 py-1 rounded-md whitespace-nowrap">Pro</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
