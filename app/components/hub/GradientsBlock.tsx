'use client'

import { useState } from 'react'
import { useHub } from './HubContext'
import { Editable } from './Editable'
import { Icon } from './Icon'
import type { GradientDef } from '@/app/types/brand'
import { Button } from '@/components/ui/button'
import { HubCard } from './HubCard'
import { CardDetail } from './CardDetail'
import { ButtonGroup } from '@/components/ui/button-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/** Gradient presets and downloadable gradient backgrounds. */
export function GradientsBlock() {
  const { config, editing, update } = useHub()
  const groups = config.gradients || []
  if (groups.length === 0 && !editing) return null

  return (
    <div className="mt-4">
      {/* One grid and one add tile, for the same reason as the swatches above:
          a per-group tile lands wherever a group ends, which is nowhere a
          reader can see now that the headings are gone. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.flatMap((group, gi) =>
          group.gradients.map((grad, i) => (
            <GradientCard
              key={`${gi}:${i}`}
              grad={grad}
              onName={v => update(c => { c.gradients![gi].gradients[i].name = v })}
              onCss={v => update(c => { c.gradients![gi].gradients[i].css = v })}
              onDelete={() => update(c => { c.gradients![gi].gradients.splice(i, 1) })}
            />
          ))
        )}
        {editing && groups.length > 0 && (
          <button
            onClick={() => update(c => { c.gradients![0].gradients.push({ name: 'New gradient', css: 'linear-gradient(90deg, #6366f1 0%, #ec4899 100%)', downloadable: true }) })}
            className="min-h-[160px] border-2 border-dashed border-border rounded-xl text-muted-foreground/60 hover:border-ring hover:text-foreground transition-colors flex items-center justify-center"
          >
            <Icon name="plus" size={16} />
          </button>
        )}
      </div>

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
  const { editing, canEdit, sandbox } = useHub()
  const [copied, setCopied] = useState(false)
  const [detail, setDetail] = useState(false)

  const mayEdit = canEdit || sandbox

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

  /* A gradient is a rule first and a picture second, so Copy CSS is always
     offered; the PNG is the extra, and only when the gradient is marked as
     one you can take away. */
  const actions = (
    <ButtonGroup className="shrink-0">
      <Button variant="outline" size="sm" onClick={copy} title="Copy CSS">
        <Icon name="copy" size={14} /> {copied ? 'Copied' : 'Copy CSS'}
      </Button>
      {(grad.downloadable || mayEdit) && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="icon-sm" aria-label={`Actions for ${grad.name}`}>
                <Icon name="more" size={14} />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={copy}>
                <Icon name="copy" size={14} /> Copy CSS
              </DropdownMenuItem>
              {grad.downloadable && (
                <DropdownMenuItem onClick={download}>
                  <Icon name="download" size={14} /> Download PNG
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            {mayEdit && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem variant="destructive" onClick={onDelete}>
                    <Icon name="trash" size={14} /> Delete
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </ButtonGroup>
  )

  return (
    <>
      <HubCard
        className="group relative"
        media={
          <button
            type="button"
            onClick={() => setDetail(true)}
            className="h-32 w-full"
            style={{ background: grad.css }}
            title={`Open ${grad.name}`}
            aria-label={`Open ${grad.name}`}
          />
        }
        action={actions}
      >
        <p className="text-[13px] font-medium text-foreground min-w-0 truncate">
          <Editable value={grad.name} placeholder="Gradient name" onChange={onName} />
        </p>
      </HubCard>

      <CardDetail
        open={detail}
        onOpenChange={setDetail}
        title={<Editable value={grad.name} placeholder="Gradient name" onChange={onName} />}
        media={<div className="h-28 w-full rounded-md" style={{ background: grad.css }} />}
        mediaClassName="bg-transparent p-0"
        rows={editing ? [] : [{ label: 'CSS', value: grad.css, mono: true }]}
        actions={actions}
      >
        {editing && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gradient-css">CSS</Label>
            {/* The only place this is editable. It used to be a bare input
                wedged under the name on a 3-across tile, about 90px wide for a
                value that is routinely 120 characters. */}
            <Textarea
              id="gradient-css"
              value={grad.css}
              onChange={e => onCss(e.target.value)}
              rows={3}
              className="font-mono text-[12px]"
              placeholder="linear-gradient(…)"
            />
          </div>
        )}
      </CardDetail>
    </>
  )
}
