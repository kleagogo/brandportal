'use client'

import { useRef, type ReactNode } from 'react'
import { useSmokyDissolve } from './index'

/**
 * Wraps anything deletable so it shreds into smoke on the way out.
 *
 * The recipe needs three elements — a stage, the card being destroyed, and a
 * canvas to snapshot it onto — which is more scaffolding than a call site
 * should have to know about. This owns that structure and hands back one
 * `dissolve()`, so a delete button becomes: play it, then remove the data when
 * it lands.
 *
 * `onDone` fires when the animation finishes, NOT when it starts, so the tile
 * stays mounted for the fall. Under reduced motion the recipe skips straight to
 * removal, which means `onDone` still runs — the delete never depends on the
 * animation happening.
 */
export function SmokyTile({
  children,
  onDone,
  render,
}: {
  children?: ReactNode
  onDone: () => void
  /** Given a dissolve trigger, render the tile and its delete control. */
  render?: (dissolve: () => void) => ReactNode
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const dissolve = useSmokyDissolve(stageRef, cardRef, canvasRef, { onDone })

  return (
    <div ref={stageRef} className="t-smoky-stage">
      <div ref={cardRef} className="t-smoky-card">
        {render ? render(dissolve) : children}
      </div>
      <canvas ref={canvasRef} className="t-smoky-canvas" aria-hidden="true" />
    </div>
  )
}
