'use client'

import { useEffect, useState } from 'react'
import { Icon } from './Icon'

interface Space {
  slug: string
  name: string
  client?: string
  logoUrl: string | null
  role: 'owner' | 'editor'
}

/** Switch between client spaces from inside a hub — the agency's daily move. */
export function SpaceSwitcher({ currentSlug, currentName }: { currentSlug: string; currentName: string }) {
  const [spaces, setSpaces] = useState<Space[] | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(d => setSpaces(d.user ? d.hubs : []))
      .catch(() => setSpaces([]))
  }, [])

  // Only useful when the visitor actually has more than this one space.
  if (!spaces || spaces.length < 2) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-1.5 text-[11px] font-medium text-[var(--hub-muted)] hover:text-[var(--hub-text)] transition-colors"
        title="Switch client space"
      >
        <Icon name="spaces" size={11} /> Switch client
        <span className="ml-auto"><Icon name="down" size={11} /></span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-6 z-40 bg-[var(--hub-panel)] border border-[var(--hub-border)] rounded-xl shadow-xl overflow-hidden max-h-[50vh] overflow-y-auto">
            {spaces.map(s => (
              <a
                key={s.slug}
                href={`/${s.slug}`}
                className={`flex items-center gap-2 px-3 py-2 hover:bg-[var(--hub-soft)] transition-colors ${s.slug === currentSlug ? 'bg-[var(--hub-soft)]' : ''}`}
              >
                {s.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logoUrl} alt="" className="w-4 h-4 object-contain shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded bg-[var(--hub-text)] text-[var(--hub-bg)] text-[8px] font-bold flex items-center justify-center shrink-0">
                    {(s.client || s.name).charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="text-[12px] font-medium truncate">{s.client || s.name}</span>
                {s.slug === currentSlug && <span className="ml-auto text-[var(--hub-muted)] shrink-0"><Icon name="check" size={11} /></span>}
              </a>
            ))}
            <a href="/dashboard" className="flex items-center gap-2 px-3 py-2 border-t border-[var(--hub-border)] hover:bg-[var(--hub-soft)] transition-colors">
              <span className="text-[var(--hub-faint)] shrink-0"><Icon name="spaces" size={11} /></span>
              <span className="text-[12px] font-medium text-[var(--hub-muted)]">All client spaces</span>
            </a>
          </div>
        </>
      )}
      <span className="sr-only">{currentName}</span>
    </div>
  )
}
