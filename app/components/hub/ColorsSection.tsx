'use client'

import { useState } from 'react'
import { useHub } from './HubContext'
import { EmptyState } from './EmptyState'
import { useConfirm } from './useConfirm'
import { Icon } from './Icon'
import { GradientsBlock } from './GradientsBlock'
import { HubCard } from './HubCard'
import { SectionHeader } from './SectionHeader'
import { CardDetail } from './CardDetail'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function normalizeHex(v: string): string {
  const h = v.trim()
  if (!h) return h
  return h.startsWith('#') ? h : `#${h}`
}

function isValidHex(v: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)
}

/** #abc and #aabbcc both expand to the six-digit form the colour input needs. */
function expandHex(v: string): string {
  if (!isValidHex(v)) return '#888888'
  const h = v.slice(1)
  return h.length === 3 ? `#${h.split('').map(c => c + c).join('')}` : `#${h}`
}

/** "18, 24, 32" — the other way people need a brand colour. */
function toRgb(v: string): string {
  if (!isValidHex(v)) return ''
  const h = expandHex(v).slice(1)
  const n = parseInt(h, 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

/** Where a swatch actually lives, so an action never depends on what is showing. */
interface SwatchAt { gi: number; si: number }

type ColorSort = 'added' | 'name'

const SORT_LABELS: Record<ColorSort, string> = {
  added: 'Order added',
  name: 'Name',
}

export function ColorsSection({ label = 'Colors' }: { label?: string }) {
  const { config, editing, update, canEdit, sandbox, active, setEditingSection } = useHub()
  const { confirm, confirmDialog } = useConfirm()
  const [copied, setCopied] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('all')
  const [sort, setSort] = useState<ColorSort>('added')
  // Which swatch is open, by position. Read back out of config on every render
  // so an edit made in the dialog shows up in it.
  const [detail, setDetail] = useState<SwatchAt | null>(null)

  const mayEdit = canEdit || sandbox
  const total = config.colors.reduce((n, g) => n + g.swatches.length, 0)

  /** Copy keyed by position, not by value — two swatches can share a hex. */
  function copyHex(key: string, hex: string) {
    navigator.clipboard.writeText(hex.toUpperCase())
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const needle = query.trim().toLowerCase()

  /**
   * Pair every swatch with its stored index before anything filters or sorts.
   *
   * Every write here is `c.colors[gi].swatches[si]`, so a list that renumbered
   * as you searched would rename the wrong colour. The index travels with the
   * swatch instead of being the position in whatever is on screen.
   */
  const groups = config.colors
    .map((g, gi) => ({
      gi,
      group: g,
      items: g.swatches
        .map((swatch, si) => ({ swatch, si }))
        .filter(() => group === 'all' || config.colors[gi].group === group)
        .filter(({ swatch }) =>
          !needle ||
          swatch.name.toLowerCase().includes(needle) ||
          swatch.hex.toLowerCase().includes(needle) ||
          (swatch.usage || '').toLowerCase().includes(needle))
        .sort((a, b) => (sort === 'name' ? a.swatch.name.localeCompare(b.swatch.name) : 0)),
    }))
    // A group with nothing left to show is noise; in edit mode it stays,
    // because that's where you add the colour that would fill it.
    .filter(g => g.items.length > 0 || (editing && group === 'all' && !needle))

  const open = detail ? config.colors[detail.gi]?.swatches[detail.si] : undefined
  const openGroup = detail ? config.colors[detail.gi]?.group : undefined

  return (
    <div>
      {confirmDialog}

      <SectionHeader
        title={label}
        description={
          editing
            ? 'Click a swatch to open it, or add colors and groups.'
            : 'Click a swatch to open it, or copy its hex straight from the card.'
        }
        actions={
          mayEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => update(c => { c.colors.push({ group: 'New group', swatches: [] }) })}
            >
              <Icon name="plus" size={13} /> Add group
            </Button>
          )
        }
        toolbar={total > 3}
        search={{
          value: query,
          onChange: setQuery,
          placeholder: 'Search…',
          label: 'Search colors',
        }}
        filters={config.colors.length > 1 ? [{
          value: group,
          onChange: setGroup,
          label: 'Filter by group',
          options: [
            { value: 'all', label: 'All groups' },
            ...config.colors.map(g => ({ value: g.group, label: g.group })),
          ],
        }] : []}
        sort={{
          value: sort,
          onChange: v => setSort(v as ColorSort),
          label: 'Sort colors',
          options: (Object.keys(SORT_LABELS) as ColorSort[]).map(k => ({ value: k, label: SORT_LABELS[k] })),
        }}
      />

      {config.colors.length === 0 && !editing && (
        <EmptyState
          title="No colors yet"
          description="Add your palette so everyone reaches for the same hex, instead of the one they remember."
          actionLabel="Add a color"
          onAction={() => update(c => {
            c.colors.push({ group: 'Brand', swatches: [{ name: 'Brand', hex: '#1a1a1a', usage: '' }] })
          })}
        />
      )}

      {total > 0 && groups.length === 0 && (
        <p className="text-[13px] text-muted-foreground">No colors match that.</p>
      )}

      {/* No heading rows. Groups are still stored, still what the filter above
          narrows by — but printed down the page they read as structure nobody
          chose. */}
      {/* One grid across every group. Each group used to draw its own, which
          was invisible while the headings were there to explain it — and once
          they went, a dashed add tile turned up wherever a group happened to
          end, mid-row and attached to nothing. */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {groups.flatMap(({ gi, items }) =>
          items.map(({ swatch, si }) => {
              const key = `${gi}:${si}`
              return (
                <HubCard
                  key={key}
                  className="group relative"
                  media={
                    // The picture is the way in, same as a file's thumbnail.
                    <button
                      onClick={() => setDetail({ gi, si })}
                      className="w-full h-24"
                      style={{ background: isValidHex(swatch.hex) ? swatch.hex : '#e5e5e0' }}
                      title={`Open ${swatch.name}`}
                      aria-label={`Open ${swatch.name}`}
                    />
                  }
                  /* A colour is not a file, so the thing this card does is hand
                     you the value — never a download. */
                  action={
                    <ButtonGroup className="shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyHex(key, swatch.hex)}
                        title={`Copy ${swatch.hex.toUpperCase()}`}
                      >
                        <Icon name="copy" size={14} /> {copied === key ? 'Copied' : 'Copy'}
                      </Button>
                      {mayEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="outline" size="icon-sm" aria-label={`Actions for ${swatch.name}`}>
                                <Icon name="more" size={14} />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuGroup>
                              {/* Edit is the card's own action now — there is
                                  no section-wide switch to find first. */}
                              <DropdownMenuItem onClick={() => { setEditingSection(active); setDetail({ gi, si }) }}>
                                <Icon name="edit" size={14} /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyHex(key, swatch.hex)}>
                                <Icon name="copy" size={14} /> Copy value
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => update(c => { c.colors[gi].swatches.splice(si, 1) })}
                              >
                                <Icon name="trash" size={14} /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </ButtonGroup>
                  }
                >
                  <p className="text-[13px] font-semibold text-foreground truncate">{swatch.name}</p>
                  <p className="text-[12px] font-mono text-muted-foreground">{swatch.hex.toUpperCase()}</p>
                  {swatch.usage && (
                    <p className="line-clamp-2 text-[11px] text-muted-foreground/60 leading-tight">{swatch.usage}</p>
                  )}
                </HubCard>
              )
            })
        )}

        {/* One tile, after everything, adding to the first group — the only
            group a viewer can see, now that the headings are gone. */}
        {mayEdit && groups.length > 0 && (
          <button
            onClick={() => {
              const gi = groups[0].gi
              const si = config.colors[gi].swatches.length
              setEditingSection(active)
              update(c => { c.colors[gi].swatches.push({ name: 'New color', hex: '#888888', usage: '' }) })
              setDetail({ gi, si })
            }}
            className="min-h-[132px] rounded-2xl border-2 border-dashed border-border text-muted-foreground/60 hover:border-ring hover:text-foreground transition-colors flex items-center justify-center"
            title="Add color"
          >
            <Icon name="plus" size={16} />
          </button>
        )}
      </div>

      {/* One colour, with room. This replaced a popover pinned inside the card,
          which `Card`'s own overflow clipped — so the usage field and Delete
          were half off the tile and unreachable on a narrow screen. */}
      {detail && open && (
        <CardDetail
          open
          onOpenChange={o => { if (!o) setDetail(null) }}
          title={open.name || 'Untitled color'}
          description={openGroup}
          media={
            <div
              className="h-28 w-full rounded-md"
              style={{ background: isValidHex(open.hex) ? open.hex : '#e5e5e0' }}
            />
          }
          mediaClassName="p-0 bg-transparent"
          rows={editing ? [] : [
            { label: 'Hex', value: open.hex.toUpperCase(), mono: true },
            { label: 'RGB', value: toRgb(open.hex), mono: true },
            { label: 'Usage', value: open.usage || <span className="text-muted-foreground">No usage note yet</span> },
          ]}
          actions={
            <>
              {editing && (
                <Button
                  variant="ghost"
                  onClick={async () => {
                    if (!(await confirm({
                      title: `Delete "${open.name}"?`,
                      confirmLabel: 'Delete color',
                      destructive: true,
                    }))) return
                    setDetail(null)
                    update(c => { c.colors[detail.gi].swatches.splice(detail.si, 1) })
                  }}
                  className="mr-auto text-muted-foreground hover:text-destructive"
                >
                  <Icon name="trash" size={14} /> Delete
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => copyHex(`${detail.gi}:${detail.si}`, open.hex)}
              >
                <Icon name="copy" size={14} />
                {copied === `${detail.gi}:${detail.si}` ? 'Copied' : 'Copy value'}
              </Button>
            </>
          }
        >
          {editing && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="swatch-name">Name</Label>
                <Input
                  id="swatch-name"
                  value={open.name}
                  onChange={e => update(c => { c.colors[detail.gi].swatches[detail.si].name = e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="swatch-hex">Hex</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    aria-label="Pick a color"
                    value={expandHex(open.hex)}
                    onChange={e => update(c => { c.colors[detail.gi].swatches[detail.si].hex = e.target.value })}
                    className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-border p-0.5"
                  />
                  <Input
                    id="swatch-hex"
                    value={open.hex}
                    // Normalising on every keystroke made the field impossible
                    // to clear — the '#' came straight back.
                    onChange={e => update(c => { c.colors[detail.gi].swatches[detail.si].hex = e.target.value })}
                    onBlur={e => update(c => { c.colors[detail.gi].swatches[detail.si].hex = normalizeHex(e.target.value) })}
                    className={`font-mono ${isValidHex(open.hex) ? '' : 'border-destructive/50'}`}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="swatch-usage">Usage note</Label>
                <Input
                  id="swatch-usage"
                  value={open.usage || ''}
                  placeholder="Where is this color used?"
                  onChange={e => update(c => { c.colors[detail.gi].swatches[detail.si].usage = e.target.value })}
                />
              </div>
            </div>
          )}
        </CardDetail>
      )}

      <GradientsBlock />
    </div>
  )
}
