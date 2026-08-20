'use client'

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { BrandConfig } from '@/app/types/brand'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface HubContextValue {
  config: BrandConfig
  /** The section on screen. */
  active: string
  setActive: (id: string) => void
  /**
   * Editing is per-section: the id being edited, or null.
   *
   * `editing` below stays a boolean because that's what every section component
   * asks for, and only one section renders at a time — so "is anything being
   * edited" and "is *this* being edited" are the same question from inside a
   * section. Scoping it here means the sidebar can offer a pencil per row
   * without each section learning about the others.
   */
  editingSection: string | null
  setEditingSection: (id: string | null) => void
  /** Leave edit mode and throw away everything changed since it began. */
  cancelEditing: () => void
  /** True when the section currently on screen is the one being edited. */
  editing: boolean
  saveState: SaveState
  /** Apply a mutation to a draft of the config; the result is set and autosaved. */
  update: (mutate: (draft: BrandConfig) => void) => void
  /** May this viewer change the hub? True before Edit mode is switched on. */
  canEdit: boolean
  /**
   * Changes are the visitor's own and are never sent anywhere — the demo.
   * Sections still render their edit controls; nothing survives a reload.
   */
  sandbox: boolean
  /** Show download controls. Share portals can turn downloads off. */
  allowDownload: boolean
  /** Set when the hub is being viewed through a share portal (/s/<id>). */
  portalId?: string
}

const HubContext = createContext<HubContextValue | null>(null)

export function useHub() {
  const ctx = useContext(HubContext)
  if (!ctx) throw new Error('useHub must be used inside <HubProvider>')
  return ctx
}

const SAVE_DEBOUNCE_MS = 800

export function HubProvider({ initial, children, openSection, canEdit = false, sandbox = false, allowDownload = true, portalId }: { initial: BrandConfig; children: React.ReactNode; openSection?: string; canEdit?: boolean; sandbox?: boolean; allowDownload?: boolean; portalId?: string }) {
  const [config, setConfig] = useState<BrandConfig>(initial)
  // `openSection` comes from the URL, already checked against this hub's own
  // sections, so a link can land on the part of the hub it is about.
  const [active, setActive] = useState(openSection || initial.sections[0]?.id || '')
  const [editingSection, setEditingSectionState] = useState<string | null>(null)
  const editing = editingSection !== null && editingSection === active
  const [saveState, setSaveState] = useState<SaveState>('idle')

  // What the hub looked like when edit mode began, so Escape can put it back.
  const snapshot = useRef<BrandConfig | null>(null)
  const configRef = useRef(config)
  configRef.current = config

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<BrandConfig | null>(null)
  const inFlight = useRef(false)

  const flush = useCallback(async () => {
    const body = pending.current
    if (!body || inFlight.current) return
    pending.current = null
    inFlight.current = true
    try {
      const res = await fetch(`/api/hubs/${encodeURIComponent(body.slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`Save failed (${res.status})`)
      setSaveState(pending.current ? 'saving' : 'saved')
    } catch {
      setSaveState('error')
    } finally {
      inFlight.current = false
      // Edits made while the request was in flight still need saving.
      if (pending.current) {
        timer.current = setTimeout(flush, SAVE_DEBOUNCE_MS)
      }
    }
  }, [])

  const update = useCallback((mutate: (draft: BrandConfig) => void) => {
    setConfig(prev => {
      const next = structuredClone(prev)
      mutate(next)
      // In the sandbox the change lives here and nowhere else: no request, so
      // nothing to save, fail, or warn about on the way out.
      if (sandbox) return next
      pending.current = next
      setSaveState('saving')
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(flush, SAVE_DEBOUNCE_MS)
      return next
    })
  }, [flush, sandbox])

  const setEditingSection = useCallback((id: string | null) => {
    setEditingSectionState(id)
    if (id === null) snapshot.current = null
  }, [])

  /**
   * Take the undo snapshot after the commit, not during the click.
   *
   * Adding a section and naming it is one gesture: `update()` queues the new
   * section and `setEditingSection()` opens its name for editing in the same
   * handler. Snapshotting inside that handler read the config from *before*
   * the section existed, so one Escape deleted the section — and, because the
   * revert autosaves, deleted it on the server along with anything else saved
   * since edit mode began. Reading it here means the snapshot always includes
   * the change that opened the editor. Layout effect, not a passive one, so it
   * lands before anyone can type.
   */
  useLayoutEffect(() => {
    if (editingSection !== null && snapshot.current === null) {
      snapshot.current = structuredClone(configRef.current)
    }
  }, [editingSection])

  const cancelEditing = useCallback(() => {
    const snap = snapshot.current
    if (snap) {
      // Restore through update() so the revert also autosaves over anything
      // the debounced save already wrote.
      update(draft => Object.assign(draft, structuredClone(snap)))
    }
    snapshot.current = null
    setEditingSectionState(null)
  }, [update])

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (pending.current || inFlight.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  return (
    <HubContext.Provider value={{ config, active, setActive, editingSection, setEditingSection, cancelEditing, editing, saveState, update, canEdit, sandbox, allowDownload, portalId }}>
      {children}
    </HubContext.Provider>
  )
}
