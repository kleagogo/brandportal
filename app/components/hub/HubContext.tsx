'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
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
  /** True when the section currently on screen is the one being edited. */
  editing: boolean
  saveState: SaveState
  /** Apply a mutation to a draft of the config; the result is set and autosaved. */
  update: (mutate: (draft: BrandConfig) => void) => void
  /** May this viewer change the hub? True before Edit mode is switched on. */
  canEdit: boolean
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

export function HubProvider({ initial, children, canEdit = false, allowDownload = true, portalId }: { initial: BrandConfig; children: React.ReactNode; canEdit?: boolean; allowDownload?: boolean; portalId?: string }) {
  const [config, setConfig] = useState<BrandConfig>(initial)
  const [active, setActive] = useState(initial.sections[0]?.id || '')
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const editing = editingSection !== null && editingSection === active
  const [saveState, setSaveState] = useState<SaveState>('idle')

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
      pending.current = next
      setSaveState('saving')
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(flush, SAVE_DEBOUNCE_MS)
      return next
    })
  }, [flush])

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (pending.current || inFlight.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  return (
    <HubContext.Provider value={{ config, active, setActive, editingSection, setEditingSection, editing, saveState, update, canEdit, allowDownload, portalId }}>
      {children}
    </HubContext.Provider>
  )
}
