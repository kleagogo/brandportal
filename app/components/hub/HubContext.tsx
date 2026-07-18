'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { BrandConfig } from '@/app/types/brand'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface HubContextValue {
  config: BrandConfig
  editing: boolean
  setEditing: (v: boolean) => void
  saveState: SaveState
  /** Apply a mutation to a draft of the config; the result is set and autosaved. */
  update: (mutate: (draft: BrandConfig) => void) => void
}

const HubContext = createContext<HubContextValue | null>(null)

export function useHub() {
  const ctx = useContext(HubContext)
  if (!ctx) throw new Error('useHub must be used inside <HubProvider>')
  return ctx
}

const SAVE_DEBOUNCE_MS = 800

export function HubProvider({ initial, children }: { initial: BrandConfig; children: React.ReactNode }) {
  const [config, setConfig] = useState<BrandConfig>(initial)
  const [editing, setEditing] = useState(false)
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
      const res = await fetch('/api/hub', {
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
    <HubContext.Provider value={{ config, editing, setEditing, saveState, update }}>
      {children}
    </HubContext.Provider>
  )
}
