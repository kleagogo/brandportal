'use client'

import { useEffect, useRef, useState } from 'react'
import { useHub } from './HubContext'
import { Icon } from './Icon'
import { PortalManager } from './PortalManager'
import { useConfettiBurst, useModalTransition } from '../transitions'

export function ShareModal({ onClose, canEdit, section }: { onClose: () => void; canEdit: boolean; section?: string }) {
  const { config } = useHub()
  // Opens on mount, and stays mounted through its exit — see useModalTransition.
  const [open, setOpen] = useState(true)
  const transition = useModalTransition(open, onClose)
  // Opened from a section's own share action: name what's being shared, and
  // seed the portal builder with just that section.
  const sectionLabel = section ? config.sections.find(s => s.id === section)?.label : undefined
  const [copied, setCopied] = useState(false)
  // The handoff is the moment the product exists for the client, so the copy
  // that carries it is the one thing here worth celebrating.
  const stageRef = useRef<HTMLDivElement>(null)
  const confettiCanvas = useRef<HTMLCanvasElement>(null)
  const copyBtn = useRef<HTMLButtonElement>(null)
  const burst = useConfettiBurst(stageRef, confettiCanvas, copyBtn)
  const [url, setUrl] = useState('')


  useEffect(() => {
    setUrl(`${window.location.origin}/${config.slug}`)
  }, [config.slug])

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    burst()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (!transition.mounted) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className={`absolute inset-0 bg-foreground/30 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
      <div className={`t-modal ${transition.className} relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-[520px] p-6 max-h-[85vh] overflow-y-auto`} role="dialog" aria-modal="true">
        <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-muted-foreground/60 hover:text-foreground transition-colors" title="Close">
          <Icon name="close" size={14} />
        </button>

        <h2 className="text-[17px] font-bold tracking-tight mb-1">
          {sectionLabel ? `Share ${sectionLabel}` : 'Share this hub'}
        </h2>
        <p className="text-[13px] text-muted-foreground mb-5">
          {sectionLabel
            ? `The link below opens the whole hub. To send ${sectionLabel} on its own, create a share link below.`
            : 'Anyone with the link can view. No account needed.'}
        </p>

        <div ref={stageRef} className="t-confetti-stage flex gap-2 mb-5">
          <canvas ref={confettiCanvas} className="t-confetti-canvas" aria-hidden="true" />
          <div className="flex-1 px-3 py-2.5 bg-muted rounded-xl text-[13px] font-mono text-foreground truncate">
            {url || `/${config.slug}`}
          </div>
          <button
            ref={copyBtn}
            onClick={() => copy(url)}
            className="px-4 py-2.5 bg-primary text-primary-foreground text-[13px] font-semibold rounded-xl hover:opacity-85 transition-colors whitespace-nowrap"
          >
            {copied ? 'Copied ✓' : 'Copy link'}
          </button>
        </div>


        <div className="mb-5">
          <PortalManager canEdit={canEdit} initialSection={section} />
        </div>

        {/* Password, expiry and editors moved to Hub settings. This dialog is
            for handing the hub to someone; deciding who may open it belongs
            with the hub's own settings, where people look for it. */}
        <div className="border-t border-dashed border-border pt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-foreground">Custom domain</p>
            <p className="text-[12px] text-muted-foreground/60">brand.yourcompany.com</p>
          </div>
          <span className="text-[11px] font-medium text-primary bg-primary/15 px-2 py-1 rounded-md whitespace-nowrap">Pro</span>
        </div>
      </div>
    </div>
  )
}
