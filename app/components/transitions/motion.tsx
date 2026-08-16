'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Read a duration custom property in ms, so JS and CSS can't drift apart. */
function durationOf(name: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (raw.endsWith('ms')) return parseFloat(raw)
  if (raw.endsWith('s')) return parseFloat(raw) * 1000
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : fallback
}

/**
 * Keeps a modal mounted long enough to play its exit.
 *
 * The recipe wants `.is-open` on open, then `.is-closing` for the close
 * duration before the node goes. React would otherwise unmount on the same tick
 * as the state change and there'd be nothing left to animate — which is why the
 * modals had no exit at all.
 *
 * Returns null once the exit has finished, so callers can render nothing.
 */
export function useModalTransition(open: boolean, onClosed: () => void) {
  const [phase, setPhase] = useState<'open' | 'closing' | 'closed'>(open ? 'open' : 'closed')
  const closedRef = useRef(onClosed)
  closedRef.current = onClosed

  useEffect(() => {
    if (open) {
      setPhase('open')
      return
    }
    if (phase === 'closed') return
    setPhase('closing')
    const ms = durationOf('--modal-close-dur', 180)
    const t = setTimeout(() => {
      setPhase('closed')
      closedRef.current()
    }, ms)
    return () => clearTimeout(t)
    // `phase` is deliberately excluded: reacting to it would restart the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return {
    mounted: phase !== 'closed',
    className: phase === 'open' ? 'is-open' : phase === 'closing' ? 'is-closing' : '',
  }
}

/**
 * Swaps text with the recipe's three-phase sequence: the old line leaves
 * upward, the content changes while parked below, then the new line rises.
 *
 * Reduced motion skips straight to the new text.
 */
export function TextSwap({ children, className = '' }: { children: string; className?: string }) {
  const [shown, setShown] = useState(children)
  const [state, setState] = useState<'' | 'is-exit' | 'is-enter-start'>('')
  const el = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (children === shown) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(children)
      return
    }
    setState('is-exit')
    const ms = durationOf('--text-swap-dur', 220)
    const t = setTimeout(() => {
      setShown(children)
      setState('is-enter-start')
      // Force the parked position to paint before releasing it, or the browser
      // coalesces both frames and the entrance never runs.
      void el.current?.offsetHeight
      requestAnimationFrame(() => setState(''))
    }, ms)
    return () => clearTimeout(t)
  }, [children, shown])

  return (
    <span ref={el} className={`t-text-swap ${state} ${className}`}>
      {shown}
    </span>
  )
}

/** Cross-fades two icons in one slot — hamburger ↔ close, pencil ↔ tick. */
export function IconSwap({ on, a, b }: { on: boolean; a: ReactNode; b: ReactNode }) {
  return (
    <span className="t-icon-swap" data-state={on ? 'b' : 'a'}>
      <span className="t-icon" data-icon="a">{a}</span>
      <span className="t-icon" data-icon="b">{b}</span>
    </span>
  )
}

/** The recipe's switch: thumb with a double bounce, track cross-fading. */
export function Toggle({
  on, onChange, label,
}: {
  on: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  const [touched, setTouched] = useState(false)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      data-on={on}
      className={`t-toggle ${touched ? 'is-init' : ''}`}
      onClick={() => { setTouched(true); onChange(!on) }}
    >
      <span className="t-toggle-thumb" />
    </button>
  )
}
