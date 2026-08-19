'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useConfettiBurst } from './use-confetti-burst'

/**
 * The moment the money lands.
 *
 * Someone has just paid and is meeting the product for the first time, so this
 * screen is allowed to be pleased about it: a check that draws itself, and a
 * burst of confetti that falls past the card and settles on the button. Both
 * are skipped under reduced motion, where the check is simply already drawn.
 */
export function Celebration() {
  const stageRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const btnRef = useRef<HTMLDivElement>(null)
  const burst = useConfettiBurst(stageRef, canvasRef, btnRef)

  useEffect(() => {
    // A beat after paint, so the card has arrived before the party starts.
    const t = window.setTimeout(burst, 260)
    return () => window.clearTimeout(t)
  }, [burst])

  return (
    <main
      ref={stageRef}
      className="relative flex-1 flex items-center justify-center px-6 py-12 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      />
      <div className="relative z-10 w-full max-w-[380px]">
        <Card className="bg-[#0E131D] border-white/10">
          <CardContent className="text-center">
            <SuccessCheck />
            <h1 className="text-[18px] font-bold tracking-tight mb-2 text-foreground">
              Payment received, thank you
            </h1>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed">
              Your account is ready. We’ve emailed you a sign-in button, so click that and
              you’re in.
            </p>
            <div ref={btnRef} className="mt-5">
              <Button nativeButton={false} render={<a href="/login" />} variant="default" className="w-full">
                Send me another link
              </Button>
            </div>
            <p className="text-[12.5px] text-muted-foreground/70 leading-relaxed mt-3">
              Nothing after a minute, request a fresh link.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

/** Green disc pops in, then the check draws itself over the arriving fill. */
function SuccessCheck() {
  const markRef = useRef<SVGPathElement>(null)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    const mark = markRef.current
    // Calibrate the dash to the real path length so the draw lands exactly on
    // the last pixel of the check — no overshoot, no gap.
    if (mark) mark.style.setProperty('--mark-len', String(Math.ceil(mark.getTotalLength())))
    const t = window.setTimeout(() => setDrawn(true), 140)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <span className="pitho-check mb-4 mx-auto block" data-state={drawn ? 'done' : 'idle'} role="img" aria-label="Payment received">
      <span className="pitho-check-disc" aria-hidden />
      <svg viewBox="0 0 24 24" aria-hidden>
        <path ref={markRef} className="pitho-check-mark" d="M8 12.5L10.8 15.5L16.4 9.5" />
      </svg>
    </span>
  )
}
