'use client'

import { useEffect, useRef, useState } from 'react'
import { useConfettiBurst, useModalTransition } from '../transitions'
import { Button } from '@/components/ui/button'

/**
 * The one moment worth celebrating: the account exists and the hub is real.
 *
 * Shown once, straight after signing up, and then never again — the hub page
 * strips the flag from the URL as this opens, so a reload or a shared link
 * doesn't replay it.
 */
export function WelcomeModal({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(true)
  const transition = useModalTransition(open, onClose)

  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const markRef = useRef<HTMLDivElement>(null)
  const burst = useConfettiBurst(stageRef, canvasRef, markRef)

  // Fire once the card has been laid out, so the canvas has a size to fill and
  // the confetti starts from where the mark actually is.
  //
  // The recipe fades its confetti out after a short rest; here the pieces stay
  // where they landed for as long as anyone is likely to be looking. The hold
  // is a CSS variable the vendored recipe reads at rest time, so this is set
  // rather than the recipe edited — and put back on the way out, since the
  // recipe reads it from :root and the share dialog uses the same burst.
  useEffect(() => {
    const root = document.documentElement
    const previous = root.style.getPropertyValue('--confetti-hold')
    root.style.setProperty('--confetti-hold', '120000ms')
    const frame = requestAnimationFrame(() => setTimeout(burst, 90))
    return () => {
      cancelAnimationFrame(frame)
      if (previous) root.style.setProperty('--confetti-hold', previous)
      else root.style.removeProperty('--confetti-hold')
    }
  }, [burst])

  if (!transition.mounted) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-foreground/30 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => setOpen(false)}
      />
      <div
        ref={stageRef}
        // `overflow-hidden` keeps the settled confetti inside the rounded
        // corners; the canvas fills the card and would otherwise square them off.
        className={`t-modal t-confetti-stage ${transition.className} relative overflow-hidden bg-card rounded-2xl border border-border shadow-2xl w-full max-w-[360px] p-7 text-center`}
        role="dialog"
        aria-modal="true"
      >
        <canvas ref={canvasRef} className="t-confetti-canvas" aria-hidden="true" />

        <h2 className="text-[19px] font-bold tracking-tight mb-1.5">You’re all set</h2>
        <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-6">
          Add your brand files, create a hub for each client, and share them with a link.
        </p>

        {/* The confetti settles on whatever this points at, so it lands on the
            button rather than the floor of the card. */}
        <div ref={markRef}>
          <Button variant="default" onClick={() => setOpen(false)} className="w-full">
            Add my first files
          </Button>
        </div>
      </div>
    </div>
  )
}
