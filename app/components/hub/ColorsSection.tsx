'use client'

import { useState } from 'react'
import { useHub } from './HubContext'
import { Editable } from './Editable'
import { Icon } from './Icon'
import { GradientsBlock } from './GradientsBlock'
import { Button } from '@/components/ui/button'
import { HubCard } from './HubCard'

function normalizeHex(v: string): string {
  let h = v.trim()
  if (!h.startsWith('#')) h = `#${h}`
  return h
}

function isValidHex(v: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)
}

export function ColorsSection() {
  const { config, editing, update } = useHub()
  const [copied, setCopied] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null) // "groupIdx:swatchIdx"

  function copyHex(hex: string) {
    navigator.clipboard.writeText(hex)
    setCopied(hex)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold tracking-tight mb-1">Colors</h1>
      <p className="text-[14px] text-muted-foreground mb-8">
        {editing ? 'Click a swatch to edit it, or add colors and groups.' : 'Our color palette — click any swatch to copy the hex value.'}
      </p>

      {config.colors.map((group, gi) => (
        <div key={gi} className="mb-10">
          <div className="flex items-center gap-2 mb-4 group/head">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              <Editable
                inline
                value={group.group}
                placeholder="Group name"
                onChange={v => update(c => { c.colors[gi].group = v })}
              />
            </p>
            {editing && (
              <button
                onClick={() => {
                  if (group.swatches.length > 0 && !window.confirm(`Delete the "${group.group}" group and its ${group.swatches.length} colors?`)) return
                  update(c => { c.colors.splice(gi, 1) })
                }}
                className="opacity-0 group-hover/head:opacity-100 text-muted-foreground/60 hover:text-destructive transition-all"
                title="Delete group"
              >
                <Icon name="trash" size={13} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            {group.swatches.map((swatch, si) => {
              const key = `${gi}:${si}`
              return (
                <HubCard
                  key={key}
                  className="group relative w-[168px]"
                  media={
                    <button
                      onClick={() => (editing ? setOpen(open === key ? null : key) : copyHex(swatch.hex))}
                      className="w-full h-24"
                      style={{ background: isValidHex(swatch.hex) ? swatch.hex : '#e5e5e0' }}
                      title={editing ? `Edit ${swatch.name}` : `Copy ${swatch.hex}`}
                    />
                  }
                  action={
                    !editing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyHex(swatch.hex)}
                        className="shrink-0 text-muted-foreground"
                        title={`Copy ${swatch.hex}`}
                      >
                        <Icon name="copy" size={14} /> {copied === swatch.hex ? 'Copied' : 'Copy'}
                      </Button>
                    )
                  }
                >
                  <p className="text-[13px] font-semibold text-foreground truncate">{swatch.name}</p>
                  <p className="text-[12px] font-mono text-muted-foreground">{swatch.hex.toUpperCase()}</p>
                  {swatch.usage && <p className="text-[11px] text-muted-foreground/60 leading-tight">{swatch.usage}</p>}

                  {editing && open === key && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setOpen(null)} />
                      <div className="absolute left-0 top-[92px] z-30 w-[240px] bg-card border border-border rounded-xl shadow-xl p-3">
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Name</label>
                        <input
                          value={swatch.name}
                          onChange={e => update(c => { c.colors[gi].swatches[si].name = e.target.value })}
                          className="w-full text-[13px] px-2 py-1.5 border border-border rounded-lg outline-none focus:border-ring mb-2.5"
                        />
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Hex</label>
                        <div className="flex gap-1.5 mb-2.5">
                          <input
                            type="color"
                            value={isValidHex(swatch.hex) && swatch.hex.length === 7 ? swatch.hex : '#888888'}
                            onChange={e => update(c => { c.colors[gi].swatches[si].hex = e.target.value })}
                            className="w-9 h-8 rounded-lg border border-border cursor-pointer p-0.5"
                          />
                          <input
                            value={swatch.hex}
                            onChange={e => update(c => { c.colors[gi].swatches[si].hex = normalizeHex(e.target.value) })}
                            className={`flex-1 text-[13px] font-mono px-2 py-1.5 border rounded-lg outline-none focus:border-ring ${isValidHex(swatch.hex) ? 'border-border' : 'border-destructive/50'}`}
                          />
                        </div>
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Usage note</label>
                        <input
                          value={swatch.usage || ''}
                          onChange={e => update(c => { c.colors[gi].swatches[si].usage = e.target.value })}
                          placeholder="Where is this color used?"
                          className="w-full text-[12px] px-2 py-1.5 border border-border rounded-lg outline-none focus:border-ring mb-3 placeholder:text-muted-foreground/60"
                        />
                        <div className="flex justify-between items-center">
                          <button
                            onClick={() => { setOpen(null); update(c => { c.colors[gi].swatches.splice(si, 1) }) }}
                            className="text-[12px] text-muted-foreground/60 hover:text-destructive flex items-center gap-1 transition-colors"
                          >
                            <Icon name="trash" size={12} /> Delete
                          </button>
                          <button
                            onClick={() => setOpen(null)}
                            className="text-[12px] font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-85 transition-colors"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </HubCard>
              )
            })}

            {editing && (
              <button
                onClick={() => {
                  update(c => { c.colors[gi].swatches.push({ name: 'New color', hex: '#888888', usage: '' }) })
                  setOpen(`${gi}:${group.swatches.length}`)
                }}
                className="w-[168px] h-[132px] rounded-2xl border-2 border-dashed border-border text-muted-foreground/60 hover:border-ring hover:text-foreground transition-colors flex items-center justify-center"
                title="Add color"
              >
                <Icon name="plus" size={16} />
              </button>
            )}
          </div>
        </div>
      ))}

      {editing && (
        <button
          onClick={() => update(c => { c.colors.push({ group: 'New group', swatches: [] }) })}
          className="text-[13px] font-medium text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-ring rounded-xl px-4 py-2.5 flex items-center gap-2 transition-colors mb-10"
        >
          <Icon name="plus" size={13} /> Add color group
        </button>
      )}

      <GradientsBlock />
    </div>
  )
}
