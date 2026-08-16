'use client'

import { useState } from 'react'
import { useHub } from './HubContext'
import { Editable } from './Editable'
import { Icon } from './Icon'
import type { GradientDef } from '@/app/types/brand'

/** Gradient presets and downloadable gradient backgrounds. */
export function GradientsBlock() {
  const { config, editing, update } = useHub()
  const groups = config.gradients || []
  if (groups.length === 0 && !editing) return null

  return (
    <div className="mt-4">
      {groups.map((group, gi) => (
        <div key={gi} className="mb-10">
          <div className="flex items-center gap-2 mb-4 group/head">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              <Editable inline value={group.group} placeholder="Group name" onChange={v => update(c => { c.gradients![gi].group = v })} />
            </p>
            {editing && (
              <button
                onClick={() => update(c => { c.gradients!.splice(gi, 1) })}
                className="opacity-0 group-hover/head:opacity-100 text-muted-foreground/60 hover:text-destructive transition-all"
                title="Delete group"
              >
                <Icon name="trash" size={13} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.gradients.map((grad, i) => (
              <GradientCard
                key={i}
                grad={grad}
                onName={v => update(c => { c.gradients![gi].gradients[i].name = v })}
                onCss={v => update(c => { c.gradients![gi].gradients[i].css = v })}
                onDelete={() => update(c => { c.gradients![gi].gradients.splice(i, 1) })}
              />
            ))}
            {editing && (
              <button
                onClick={() => update(c => { c.gradients![gi].gradients.push({ name: 'New gradient', css: 'linear-gradient(90deg, #6366f1 0%, #ec4899 100%)', downloadable: true }) })}
                className="min-h-[160px] border-2 border-dashed border-border rounded-xl text-muted-foreground/60 hover:border-ring hover:text-foreground transition-colors flex items-center justify-center"
              >
                <Icon name="plus" size={16} />
              </button>
            )}
          </div>
        </div>
      ))}

      {editing && (
        <button
          onClick={() => update(c => { if (!c.gradients) c.gradients = []; c.gradients.push({ group: 'New gradient group', gradients: [] }) })}
          className="text-[13px] font-medium text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-ring rounded-xl px-4 py-2.5 flex items-center gap-2 transition-colors"
        >
          <Icon name="plus" size={13} /> Add gradient group
        </button>
      )}
    </div>
  )
}

function GradientCard({ grad, onName, onCss, onDelete }: {
  grad: GradientDef
  onName: (v: string) => void
  onCss: (v: string) => void
  onDelete: () => void
}) {
  const { editing } = useHub()
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(grad.css)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function download() {
    // Render the CSS gradient to a PNG via canvas.
    const canvas = document.createElement('canvas')
    canvas.width = 1600; canvas.height = 900
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const stops = [...grad.css.matchAll(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g)].map(m => m[0])
    const isVertical = /(\b0deg\b|to top|to bottom|180deg)/.test(grad.css)
    const g = isVertical ? ctx.createLinearGradient(0, 0, 0, 900) : ctx.createLinearGradient(0, 0, 1600, 0)
    if (stops.length === 0) stops.push('#6366f1', '#ec4899')
    stops.forEach((s, idx) => g.addColorStop(stops.length === 1 ? 0 : idx / (stops.length - 1), s))
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1600, 900)
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `${grad.name.replace(/[^\w-]+/g, '-')}.png`
    a.click()
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden group relative">
      {editing && (
        <button onClick={onDelete} className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-card/80 text-foreground/90 hover:text-destructive items-center justify-center hidden group-hover:flex" title="Remove gradient">
          <Icon name="close" size={11} />
        </button>
      )}
      <div className="h-32" style={{ background: grad.css }} />
      <div className="p-3 flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-foreground min-w-0 truncate">
          <Editable value={grad.name} placeholder="Gradient name" onChange={onName} />
        </p>
        <button
          onClick={grad.downloadable ? download : copy}
          className="shrink-0 flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          title={grad.downloadable ? 'Download PNG' : 'Copy CSS'}
        >
          {grad.downloadable ? <><Icon name="download" size={12} /> Download</> : (copied ? 'Copied ✓' : <Icon name="copy" size={13} />)}
        </button>
      </div>
      {editing && (
        <div className="px-3 pb-3">
          <input
            value={grad.css}
            onChange={e => onCss(e.target.value)}
            className="w-full text-[11px] font-mono px-2 py-1.5 border border-border rounded-lg outline-none focus:border-ring bg-background"
            placeholder="linear-gradient(…)"
          />
        </div>
      )}
    </div>
  )
}
