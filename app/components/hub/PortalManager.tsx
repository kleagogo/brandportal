'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PortalTemplate, SharePortal } from '@/app/types/brand'
import { useHub } from './HubContext'
import { Icon } from './Icon'
import { uploadAsset } from './upload-client'

const TEMPLATES: Array<{ id: PortalTemplate; label: string; blurb: string }> = [
  { id: 'full',    label: 'Full hub',  blurb: 'Sidebar and every section — the hub, read-only' },
  { id: 'gallery', label: 'Gallery',   blurb: 'One scrolling page, presentation-style' },
  { id: 'minimal', label: 'Downloads', blurb: 'A plain file list, nothing else' },
]

type Draft = Omit<SharePortal, 'id' | 'slug' | 'createdAt'>

interface PortalSummary { views: number; downloads: number; lastViewAt?: string }

function emptyDraft(name: string): Draft {
  return {
    name: `${name} — client share`,
    template: 'full',
    sections: [],
    password: null,
    expiresAt: null,
    allowDownload: true,
    branding: {},
  }
}

/**
 * Share links with templates and white-labelling.
 *
 * Each portal is an independent link (/s/<id>) so an agency can hand a client
 * the full hub, a press kit, and a downloads-only list from the same brand.
 */
export function PortalManager({ canEdit, initialSection }: { canEdit: boolean; initialSection?: string }) {
  const { config } = useHub()
  const [portals, setPortals] = useState<SharePortal[]>([])
  const [stats, setStats] = useState<Record<string, PortalSummary>>({})
  const [activity, setActivity] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [editing, setEditing] = useState<string | null>(null) // portal id, or 'new'
  const [draft, setDraft] = useState<Draft>(emptyDraft(config.name))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState('')

  const base = `/api/hubs/${encodeURIComponent(config.slug)}/portals`

  const load = useCallback(async () => {
    try {
      const res = await fetch(base)
      if (!res.ok) return
      const data = await res.json()
      setPortals(data.portals || [])
      setStats(data.stats || {})
    } catch { /* the list just stays empty */ } finally {
      setLoaded(true)
    }
  }, [base])

  useEffect(() => { if (canEdit) load() }, [canEdit, load])

  function startNew() {
    // Opened from a section's share action: scope the new link to it.
    setDraft({ ...emptyDraft(config.name), sections: initialSection ? [initialSection] : [] })
    setEditing('new')
    setError('')
  }

  function startEdit(portal: SharePortal) {
    const { id, slug, createdAt, ...rest } = portal
    void id; void slug; void createdAt
    setDraft({ ...rest, sections: rest.sections || [], branding: rest.branding || {} })
    setEditing(portal.id)
    setError('')
  }

  async function save() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(editing === 'new' ? base : `${base}/${editing}`, {
        method: editing === 'new' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Couldn’t save that share link')
      setEditing(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save that share link')
    } finally {
      setBusy(false)
    }
  }

  async function destroy(id: string) {
    if (!window.confirm('Delete this share link? Anyone using it loses access immediately.')) return
    await fetch(`${base}/${id}`, { method: 'DELETE' })
    setPortals(list => list.filter(p => p.id !== id))
  }

  function copy(portal: SharePortal) {
    navigator.clipboard.writeText(`${window.location.origin}/s/${portal.id}`)
    setCopiedId(portal.id)
    setTimeout(() => setCopiedId(''), 1500)
  }

  if (!canEdit) return null

  return (
    <div className="border-t border-dashed border-border pt-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-[13px] font-medium text-foreground">Share links</p>
          <p className="text-[12px] text-muted-foreground/60">Pick a template, choose sections, white-label it</p>
        </div>
        {!editing && (
          <button
            onClick={startNew}
            className="text-[12.5px] font-semibold border-[1.5px] border-foreground px-3 py-1.5 rounded-xl hover:bg-foreground hover:text-background transition-colors whitespace-nowrap"
          >
            New link
          </button>
        )}
      </div>

      {error && <p className="text-[12.5px] text-destructive mb-3">{error}</p>}

      {editing ? (
        <Editor
          draft={draft}
          setDraft={setDraft}
          busy={busy}
          onCancel={() => { setEditing(null); setError('') }}
          onSave={save}
        />
      ) : (
        <div className="space-y-2">
          {loaded && portals.length === 0 && (
            <p className="text-[12px] text-muted-foreground/60">No share links yet — create one to send a client a tailored view.</p>
          )}
          {portals.map(portal => {
            const stat = stats[portal.id] || { views: 0, downloads: 0 }
            return (
            <div key={portal.id} className="bg-muted rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium truncate">{portal.name}</p>
                  <p className="text-[11px] text-muted-foreground/60 truncate">
                    {TEMPLATES.find(t => t.id === portal.template)?.label}
                    {portal.password ? ' · password' : ''}
                    {portal.expiresAt ? ` · until ${new Date(portal.expiresAt).toLocaleDateString()}` : ''}
                    {portal.branding?.hideCredit ? ' · white-label' : ''}
                    {!portal.allowDownload ? ' · view only' : ''}
                  </p>
                </div>
                <button onClick={() => copy(portal)} className="text-[11.5px] font-semibold text-foreground whitespace-nowrap px-2 py-1 rounded-lg hover:bg-card transition-colors">
                  {copiedId === portal.id ? 'Copied ✓' : 'Copy'}
                </button>
                <a href={`/s/${portal.id}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground/60 hover:text-foreground transition-colors" title="Open">
                  <Icon name="link" size={12} />
                </a>
                <button onClick={() => startEdit(portal)} className="text-muted-foreground/60 hover:text-foreground transition-colors" title="Edit">
                  <Icon name="edit" size={12} />
                </button>
                <button onClick={() => destroy(portal.id)} className="text-muted-foreground/60 hover:text-destructive transition-colors" title="Delete">
                  <Icon name="trash" size={12} />
                </button>
              </div>

              <button
                onClick={() => setActivity(activity === portal.id ? null : portal.id)}
                className="mt-1 flex items-center gap-2.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <span><b className="font-semibold">{stat.views}</b> {stat.views === 1 ? 'view' : 'views'}</span>
                <span><b className="font-semibold">{stat.downloads}</b> {stat.downloads === 1 ? 'download' : 'downloads'}</span>
                {stat.lastViewAt && <span className="text-muted-foreground/60">last {relativeTime(stat.lastViewAt)}</span>}
                {(stat.views > 0 || stat.downloads > 0) && <Icon name={activity === portal.id ? 'up' : 'down'} size={9} />}
              </button>

              {activity === portal.id && <Activity slug={config.slug} portalId={portal.id} />}
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Activity ─────────────────────────────────────────────────────────────────

interface PortalEvent { at: string; type: 'view' | 'download'; label?: string }

/** The recent view/download tail for one share link. */
function Activity({ slug, portalId }: { slug: string; portalId: string }) {
  const [events, setEvents] = useState<PortalEvent[] | null>(null)

  useEffect(() => {
    fetch(`/api/hubs/${encodeURIComponent(slug)}/portals/${portalId}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => setEvents(d?.stats?.recent || []))
      .catch(() => setEvents([]))
  }, [slug, portalId])

  if (!events) return <p className="text-[11px] text-muted-foreground/60 mt-2">Loading…</p>
  if (events.length === 0) return <p className="text-[11px] text-muted-foreground/60 mt-2">Nothing yet — no one has opened this link.</p>

  return (
    <div className="mt-2 pt-2 border-t border-dashed border-border space-y-1 max-h-40 overflow-y-auto">
      {events.map((event, i) => (
        <div key={`${event.at}-${i}`} className="flex items-center gap-2 text-[11px]">
          <Icon name={event.type === 'view' ? 'link' : 'download'} size={10} />
          <span className="text-muted-foreground truncate flex-1">
            {event.type === 'view' ? 'Opened the link' : `Downloaded ${event.label || 'a file'}`}
          </span>
          <span className="text-muted-foreground/60 shrink-0">{relativeTime(event.at)}</span>
        </div>
      ))}
    </div>
  )
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

// ─── Editor ───────────────────────────────────────────────────────────────────

function Editor({
  draft, setDraft, busy, onCancel, onSave,
}: {
  draft: Draft
  setDraft: (next: Draft) => void
  busy: boolean
  onCancel: () => void
  onSave: () => void
}) {
  const { config } = useHub()
  const [whiteLabel, setWhiteLabel] = useState(Boolean(draft.branding?.hideCredit || draft.branding?.name || draft.branding?.logoUrl))
  const logoInput = useRef<HTMLInputElement>(null)
  const [logoBusy, setLogoBusy] = useState(false)

  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch })
  const setBranding = (patch: Partial<NonNullable<Draft['branding']>>) =>
    setDraft({ ...draft, branding: { ...draft.branding, ...patch } })

  // Only sections a portal actually renders — links, home, and sub-brand
  // placeholders never show up in a shared view.
  const shareable = config.sections.filter(s => !['link', 'home', 'subbrand'].includes(s.type))
  const chosen = draft.sections || []

  function toggleSection(id: string) {
    // An empty list means "everything", so materialise it on first change.
    const current = chosen.length === 0 ? shareable.map(s => s.id) : chosen
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id]
    set({ sections: next.length === shareable.length ? [] : next })
  }

  async function uploadLogo(file: File) {
    setLogoBusy(true)
    try {
      const data = await uploadAsset(file, config.slug)
      setBranding({ logoUrl: data.url })
    } catch { /* keep whatever logo is set */ } finally {
      setLogoBusy(false)
    }
  }

  return (
    <div className="bg-muted rounded-2xl p-3.5 space-y-4">
      <input
        value={draft.name}
        onChange={e => set({ name: e.target.value })}
        placeholder="What is this link for?"
        className="w-full text-[13px] font-medium px-3 py-2 rounded-xl bg-card border-[1.5px] border-border outline-none focus:border-ring transition-colors"
      />

      {/* Template */}
      <div className="grid grid-cols-3 gap-2">
        {TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => set({ template: t.id })}
            className={`text-left p-2.5 rounded-xl border-[1.5px] transition-colors ${
              draft.template === t.id ? 'border-foreground bg-card' : 'border-border hover:border-muted-foreground'
            }`}
          >
            <TemplateThumb template={t.id} />
            <p className="text-[12px] font-semibold mt-2">{t.label}</p>
            <p className="text-[10.5px] text-muted-foreground/60 leading-tight mt-0.5">{t.blurb}</p>
          </button>
        ))}
      </div>

      {/* Sections */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1.5">
          Sections {chosen.length === 0 ? '· all' : `· ${chosen.length} of ${shareable.length}`}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {shareable.map(section => {
            const on = chosen.length === 0 || chosen.includes(section.id)
            return (
              <button
                key={section.id}
                onClick={() => toggleSection(section.id)}
                className={`text-[11.5px] px-2.5 py-1 rounded-lg border transition-colors ${
                  on ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-ring'
                }`}
              >
                {section.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Access */}
      <div className="space-y-2.5">
        <Row label="Downloads allowed" hint={draft.allowDownload ? 'Viewers can download files' : 'View only — no download buttons'}>
          <Toggle on={draft.allowDownload} onClick={() => set({ allowDownload: !draft.allowDownload })} />
        </Row>
        <Row label="Password" hint={draft.password ? 'Required to open the link' : 'Anyone with the link can open it'}>
          <input
            value={draft.password || ''}
            onChange={e => set({ password: e.target.value || null })}
            placeholder="Optional"
            className="w-32 text-[12px] px-2.5 py-1.5 rounded-xl bg-card border-[1.5px] border-border outline-none focus:border-ring transition-colors"
          />
        </Row>
        <Row label="Expires" hint={draft.expiresAt ? `Stops working ${new Date(draft.expiresAt).toLocaleDateString()}` : 'Never expires'}>
          <input
            type="date"
            value={draft.expiresAt ? new Date(draft.expiresAt).toISOString().slice(0, 10) : ''}
            onChange={e => set({ expiresAt: e.target.value ? new Date(`${e.target.value}T23:59:59`).toISOString() : null })}
            className="text-[12px] px-2.5 py-1.5 rounded-xl bg-card border-[1.5px] border-border outline-none focus:border-ring transition-colors"
          />
        </Row>
        <Row label="White-label" hint="Your logo and colors, no Pitho credit">
          <Toggle
            on={whiteLabel}
            onClick={() => {
              const next = !whiteLabel
              setWhiteLabel(next)
              setBranding({ hideCredit: next })
            }}
          />
        </Row>
      </div>

      {whiteLabel && (
        <div className="space-y-2 border-t border-dashed border-border pt-3">
          <div className="flex gap-2 items-center">
            <button
              onClick={() => logoInput.current?.click()}
              className={`w-10 h-10 shrink-0 rounded-xl border-[1.5px] border-dashed border-border hover:border-ring flex items-center justify-center overflow-hidden transition-colors ${logoBusy ? 'animate-pulse' : ''}`}
              title="Upload a logo"
            >
              {draft.branding?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.branding.logoUrl} alt="" className="w-full h-full object-contain p-1" />
              ) : (
                <Icon name="upload" size={13} />
              )}
            </button>
            <input
              value={draft.branding?.name || ''}
              onChange={e => setBranding({ name: e.target.value })}
              placeholder={config.name}
              className="flex-1 min-w-0 text-[12.5px] px-3 py-2 rounded-xl bg-card border-[1.5px] border-border outline-none focus:border-ring transition-colors"
            />
            <input
              type="color"
              value={draft.branding?.accent || '#1a1a1a'}
              onChange={e => setBranding({ accent: e.target.value })}
              className="w-10 h-10 shrink-0 rounded-xl border-[1.5px] border-border bg-card cursor-pointer"
              title="Accent color"
            />
          </div>
          <input
            value={draft.branding?.note || ''}
            onChange={e => setBranding({ note: e.target.value })}
            placeholder="Prepared by Studio North"
            className="w-full text-[12.5px] px-3 py-2 rounded-xl bg-card border-[1.5px] border-border outline-none focus:border-ring transition-colors"
          />
          <input
            ref={logoInput}
            type="file"
            accept=".svg,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = '' }}
          />
        </div>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <button onClick={onCancel} className="text-[12.5px] font-semibold px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors">
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={busy}
          className="text-[12.5px] font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:opacity-85 transition-colors disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save link'}
        </button>
      </div>
    </div>
  )
}

function Row({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[12.5px] font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground/60 truncate">{hint}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-10 h-6 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-border'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-card rounded-full shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  )
}

/** Tiny wireframe of what each template looks like. */
function TemplateThumb({ template }: { template: PortalTemplate }) {
  const bar = 'bg-border rounded-[2px]'
  return (
    <div className="h-9 rounded-lg bg-card border border-border p-1 flex gap-1 overflow-hidden">
      {template === 'full' && (
        <>
          <div className={`w-3 ${bar}`} />
          <div className="flex-1 grid grid-cols-2 gap-1">
            <div className={bar} /><div className={bar} /><div className={bar} /><div className={bar} />
          </div>
        </>
      )}
      {template === 'gallery' && (
        <div className="flex-1 flex flex-col gap-1">
          <div className={`h-2 ${bar}`} />
          <div className={`flex-1 ${bar}`} />
        </div>
      )}
      {template === 'minimal' && (
        <div className="flex-1 flex flex-col gap-1 justify-center">
          <div className={`h-1.5 ${bar}`} /><div className={`h-1.5 ${bar}`} /><div className={`h-1.5 ${bar}`} />
        </div>
      )}
    </div>
  )
}
