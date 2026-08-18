'use client'

import { useState } from 'react'
import { useHub } from './HubContext'
import { EmptyState } from './EmptyState'
import { Editable } from './Editable'
import { useConfirm } from './useConfirm'
import { Icon } from './Icon'
import { HubCard } from './HubCard'
import { SectionHeader } from './SectionHeader'
import { CardDetail } from './CardDetail'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const ALL_WEIGHTS = ['100', '200', '300', '400', '500', '600', '700', '800', '900']

function googleFontUrl(name: string, weights: string[]): string {
  const family = name.trim().replace(/ /g, '+')
  const wght = [...weights].sort((a, b) => Number(a) - Number(b)).join(';')
  return `https://fonts.googleapis.com/css2?family=${family}${wght ? `:wght@${wght}` : ''}&display=swap`
}

/** What someone actually pastes into a stylesheet. */
function cssFor(font: { name: string; cssSnippet?: string }): string {
  return font.cssSnippet || `font-family: '${font.name}', sans-serif;`
}

/** Where a font lives, so an action never depends on what is showing. */
interface FontAt { gi: number; fi: number }

type FontSort = 'added' | 'name'

const SORT_LABELS: Record<FontSort, string> = {
  added: 'Order added',
  name: 'Name',
}

export function TypographySection({ label = 'Typography' }: { label?: string }) {
  const { config, editing, update, canEdit, sandbox } = useHub()
  const { confirm, confirmDialog } = useConfirm()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('all')
  const [weight, setWeight] = useState('all')
  const [sort, setSort] = useState<FontSort>('added')
  const [copied, setCopied] = useState<string | null>(null)
  const [detail, setDetail] = useState<FontAt | null>(null)

  const mayEdit = canEdit || sandbox
  const needle = query.trim().toLowerCase()
  const total = config.typography.reduce((n, g) => n + g.fonts.length, 0)
  const weightsPresent = Array.from(
    new Set(config.typography.flatMap(g => g.fonts.flatMap(f => f.weights)))
  ).sort((a, b) => Number(a) - Number(b))

  function copyCss(key: string, font: { name: string; cssSnippet?: string }) {
    navigator.clipboard.writeText(cssFor(font))
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  /** Seed the first group when there is none, so "Add typeface" always works. */
  function addTypeface() {
    update(c => {
      if (c.typography.length === 0) c.typography.push({ group: 'Brand typefaces', fonts: [] })
      c.typography[c.typography.length - 1].fonts.push({
        name: 'Inter',
        role: 'New typeface',
        weights: ['400', '600'],
        usage: '',
        importUrl: googleFontUrl('Inter', ['400', '600']),
        specimens: [{ label: 'Sample', size: '20px', weight: '400', sample: 'The quick brown fox jumps over the lazy dog' }],
      })
    })
  }

  /**
   * Fonts paired with their stored index before anything filters or sorts.
   *
   * Every write is `c.typography[gi].fonts[fi]`, so a filtered list that
   * renumbered would edit a different typeface than the one on screen.
   */
  const groups = config.typography
    .map((g, gi) => ({
      gi,
      group: g,
      items: g.fonts
        .map((font, fi) => ({ font, fi }))
        .filter(() => group === 'all' || g.group === group)
        .filter(({ font }) => weight === 'all' || font.weights.includes(weight))
        .filter(({ font }) =>
          !needle ||
          font.name.toLowerCase().includes(needle) ||
          (font.primaryLabel || font.role || '').toLowerCase().includes(needle) ||
          (font.usage || '').toLowerCase().includes(needle))
        .sort((a, b) => (sort === 'name' ? a.font.name.localeCompare(b.font.name) : 0)),
    }))
    .filter(g => g.items.length > 0)

  const open = detail ? config.typography[detail.gi]?.fonts[detail.fi] : undefined
  const openGroup = detail ? config.typography[detail.gi]?.group : undefined

  return (
    <div>
      {confirmDialog}

      <SectionHeader
        title={label}
        description={
          editing
            ? 'Click a typeface to open it. Google Fonts load automatically by name.'
            : 'Our typefaces, weights, and how to use them.'
        }
        actions={
          editing && (
            <Button size="sm" variant="outline" onClick={addTypeface}>
              <Icon name="plus" size={13} /> Add typeface
            </Button>
          )
        }
        toolbar={total > 3}
        search={{
          value: query,
          onChange: setQuery,
          placeholder: 'Search typefaces…',
          label: 'Search typefaces',
        }}
        filters={[
          ...(config.typography.length > 1 ? [{
            value: group,
            onChange: setGroup,
            label: 'Filter by group',
            options: [
              { value: 'all', label: 'All groups' },
              ...config.typography.map(g => ({ value: g.group, label: g.group })),
            ],
          }] : []),
          ...(weightsPresent.length > 1 ? [{
            value: weight,
            onChange: setWeight,
            label: 'Filter by weight',
            className: 'w-32',
            options: [
              { value: 'all', label: 'Any weight' },
              ...weightsPresent.map(w => ({ value: w, label: `Weight ${w}` })),
            ],
          }] : []),
        ]}
        sort={{
          value: sort,
          onChange: v => setSort(v as FontSort),
          label: 'Sort typefaces',
          options: (Object.keys(SORT_LABELS) as FontSort[]).map(k => ({ value: k, label: SORT_LABELS[k] })),
        }}
      />

      {total === 0 && !editing && (
        <EmptyState
          title="No typefaces yet"
          description="Add the fonts the brand is set in, with the weights and sizes that go with them."
          actionLabel="Add a typeface"
          onAction={addTypeface}
        />
      )}

      {total > 0 && groups.length === 0 && (
        <p className="text-[13px] text-muted-foreground">No typefaces match that.</p>
      )}

      {groups.map(({ gi, group: g, items }) => (
        <div key={gi} className="mb-10">
          <p className="text-[13px] font-medium text-muted-foreground mb-4">
            <Editable inline value={g.group} placeholder="Group name" onChange={v => update(c => { c.typography[gi].group = v })} />
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(({ font, fi }) => {
              const key = `${gi}:${fi}`
              return (
                <HubCard
                  key={key}
                  className="group relative"
                  mediaClassName="aspect-[4/3] p-6"
                  /* A typeface's picture is the typeface. Same tap target as a
                     file's thumbnail, opening the same kind of detail. */
                  media={
                    <button
                      onClick={() => setDetail({ gi, fi })}
                      className="flex h-full w-full flex-col items-center justify-center gap-1 leading-none"
                      title={`Open ${font.name}`}
                      aria-label={`Open ${font.name}`}
                    >
                      <span
                        className="text-[44px] text-foreground"
                        style={{ fontFamily: `'${font.name}', sans-serif` }}
                      >
                        Ag
                      </span>
                      <span
                        className="max-w-full truncate text-[12px] text-muted-foreground"
                        style={{ fontFamily: `'${font.name}', sans-serif` }}
                      >
                        {font.name}
                      </span>
                    </button>
                  }
                  chips={font.weights.map(w => <Badge key={w} variant="secondary">{w}</Badge>)}
                  /* Nobody downloads a typeface from here — the files are
                     rarely attached, and what a developer needs is the rule. */
                  action={
                    <ButtonGroup className="shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyCss(key, font)}
                        title={`Copy CSS for ${font.name}`}
                      >
                        <Icon name="copy" size={14} /> {copied === key ? 'Copied' : 'Copy CSS'}
                      </Button>
                      {mayEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="outline" size="icon-sm" aria-label={`Actions for ${font.name}`}>
                                <Icon name="more" size={14} />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuGroup>
                              <DropdownMenuItem onClick={() => setDetail({ gi, fi })}>
                                <Icon name="edit" size={14} /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyCss(key, font)}>
                                <Icon name="copy" size={14} /> Copy CSS
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={async () => {
                                  if (!(await confirm({
                                    title: `Remove "${font.name}"?`,
                                    description: 'It comes out of the type system.',
                                    confirmLabel: 'Remove font',
                                    destructive: true,
                                  }))) return
                                  update(c => { c.typography[gi].fonts.splice(fi, 1) })
                                }}
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
                  <p className="text-[13px] font-semibold text-foreground truncate">{font.name}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {font.primaryLabel || font.role}
                  </p>
                </HubCard>
              )
            })}
          </div>
        </div>
      ))}

      {/* The type scale, the CSS and the font files used to be stacked on the
          card itself, which made one typeface taller than a whole section of
          logos. The card is now the same size as every other card, and this is
          where the depth went. */}
      {detail && open && (
        <TypeDetail
          at={detail}
          onClose={() => setDetail(null)}
          groupName={openGroup}
          copiedKey={copied}
          onCopy={() => copyCss(`${detail.gi}:${detail.fi}`, open)}
          onDelete={async () => {
            if (!(await confirm({
              title: `Remove "${open.name}"?`,
              description: 'It comes out of the type system.',
              confirmLabel: 'Remove font',
              destructive: true,
            }))) return
            setDetail(null)
            update(c => { c.typography[detail.gi].fonts.splice(detail.fi, 1) })
          }}
        />
      )}
    </div>
  )
}

/** One typeface, opened up. Reads itself back out of config every render. */
function TypeDetail({
  at, onClose, groupName, copiedKey, onCopy, onDelete,
}: {
  at: FontAt
  onClose: () => void
  groupName?: string
  copiedKey: string | null
  onCopy: () => void
  onDelete: () => void
}) {
  const { config, editing, update, allowDownload } = useHub()
  const font = config.typography[at.gi]?.fonts[at.fi]
  if (!font) return null
  const key = `${at.gi}:${at.fi}`
  const face = { fontFamily: `'${font.name}', sans-serif` }

  return (
    <CardDetail
      open
      onOpenChange={o => { if (!o) onClose() }}
      title={<span style={face}>{font.name}</span>}
      description={groupName}
      media={<span className="text-[56px] leading-none text-foreground" style={face}>Ag</span>}
      chips={font.weights.map(w => <Badge key={w} variant="secondary">{w}</Badge>)}
      rows={editing ? [] : [
        { label: 'Role', value: font.primaryLabel || font.role },
        { label: 'Usage', value: font.usage },
        { label: 'CSS', value: cssFor(font), mono: true },
      ]}
      actions={
        <>
          {editing && (
            <Button variant="ghost" onClick={onDelete} className="mr-auto text-muted-foreground hover:text-destructive">
              <Icon name="trash" size={14} /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={onCopy}>
            <Icon name="copy" size={14} /> {copiedKey === key ? 'Copied' : 'Copy CSS'}
          </Button>
        </>
      }
    >
      {editing && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="font-name">Name</Label>
            <Input
              id="font-name"
              value={font.name}
              onChange={e => update(c => { c.typography[at.gi].fonts[at.fi].name = e.target.value })}
              // The Google Fonts URL is rebuilt when you stop typing, not on
              // every keystroke — Hub renders a stylesheet link per distinct
              // value, so "Inter" used to request I, In, Int and Inte too.
              onBlur={() => update(c => {
                const f = c.typography[at.gi].fonts[at.fi]
                f.importUrl = googleFontUrl(f.name, f.weights)
              })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="font-role">Role</Label>
            <Input
              id="font-role"
              value={font.primaryLabel || font.role || ''}
              placeholder="Primary — headings and body"
              onChange={e => update(c => { c.typography[at.gi].fonts[at.fi].primaryLabel = e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="font-usage">Usage note</Label>
            <Input
              id="font-usage"
              value={font.usage || ''}
              placeholder="Where is this typeface used?"
              onChange={e => update(c => { c.typography[at.gi].fonts[at.fi].usage = e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Weights</Label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_WEIGHTS.map(w => {
                const active = font.weights.includes(w)
                return (
                  <Button
                    key={w}
                    size="xs"
                    variant={active ? 'default' : 'outline'}
                    onClick={() => update(c => {
                      const f = c.typography[at.gi].fonts[at.fi]
                      f.weights = active
                        ? f.weights.filter(x => x !== w)
                        : [...f.weights, w].sort((a, b) => Number(a) - Number(b))
                      f.importUrl = googleFontUrl(f.name, f.weights)
                    })}
                    title={`Weight ${w}`}
                  >
                    {w}
                  </Button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="font-css">CSS</Label>
            <Input
              id="font-css"
              value={font.cssSnippet || ''}
              placeholder={cssFor({ name: font.name })}
              className="font-mono text-[12px]"
              onChange={e => update(c => { c.typography[at.gi].fonts[at.fi].cssSnippet = e.target.value })}
            />
          </div>
        </div>
      )}

      {font.downloads && font.downloads.length > 0 && allowDownload && (
        <div className="flex flex-col gap-1.5">
          <Label>Font files</Label>
          <div className="grid grid-cols-2 gap-2">
            {font.downloads.map((d, di) => (
              d.file ? (
                <a
                  key={di}
                  href={d.file}
                  download
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-[12px] transition-colors hover:border-ring"
                >
                  <Icon name="download" size={12} /> {d.label}
                </a>
              ) : (
                // A dead link that looks live is worse than saying so.
                <span
                  key={di}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-[12px] text-muted-foreground"
                >
                  {d.label} · not uploaded
                </span>
              )
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label>Type scale</Label>
        {font.specimens.length === 0 && !editing && (
          <p className="text-[13px] text-muted-foreground">No sizes recorded yet.</p>
        )}
        {font.specimens.map((spec, si) => (
          <div key={si} className="group/spec rounded-lg border border-border bg-background px-3 py-2.5">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[12px] text-muted-foreground">
                <Editable inline value={spec.label} placeholder="Label" onChange={v => update(c => { c.typography[at.gi].fonts[at.fi].specimens[si].label = v })} />
              </span>
              <Badge variant="secondary">{spec.weight}</Badge>
              <Badge variant="secondary">{spec.size}</Badge>
              {spec.kerning && <Badge variant="secondary">Kerning {spec.kerning}</Badge>}
              {spec.lineHeight && <Badge variant="secondary">Line {spec.lineHeight}</Badge>}
            </div>
            <Editable
              value={spec.sample}
              placeholder="Specimen text"
              onChange={v => update(c => { c.typography[at.gi].fonts[at.fi].specimens[si].sample = v })}
              className="text-foreground leading-tight"
              style={{
                ...face,
                fontSize: spec.size,
                fontWeight: Number(spec.weight) || 400,
                lineHeight: spec.lineHeight || 1.2,
                letterSpacing: spec.kerning ? `${parseFloat(spec.kerning) / 100}em` : undefined,
              }}
            />
            {editing && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Input
                  value={spec.size}
                  onChange={e => update(c => { c.typography[at.gi].fonts[at.fi].specimens[si].size = e.target.value })}
                  className="h-7 w-20 font-mono text-[11px]"
                  aria-label="Size"
                  placeholder="24px"
                />
                <Input
                  value={spec.weight}
                  onChange={e => update(c => { c.typography[at.gi].fonts[at.fi].specimens[si].weight = e.target.value })}
                  className="h-7 w-16 font-mono text-[11px]"
                  aria-label="Weight"
                  placeholder="400"
                />
                {/* Both of these were shown as badges and editable nowhere. */}
                <Input
                  value={spec.kerning || ''}
                  onChange={e => update(c => { c.typography[at.gi].fonts[at.fi].specimens[si].kerning = e.target.value })}
                  className="h-7 w-20 font-mono text-[11px]"
                  aria-label="Kerning"
                  placeholder="-2%"
                />
                <Input
                  value={spec.lineHeight || ''}
                  onChange={e => update(c => { c.typography[at.gi].fonts[at.fi].specimens[si].lineHeight = e.target.value })}
                  className="h-7 w-20 font-mono text-[11px]"
                  aria-label="Line height"
                  placeholder="110%"
                />
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Remove specimen"
                  className="ml-auto text-muted-foreground hover:text-destructive"
                  onClick={() => update(c => { c.typography[at.gi].fonts[at.fi].specimens.splice(si, 1) })}
                >
                  <Icon name="close" size={11} />
                </Button>
              </div>
            )}
          </div>
        ))}
        {editing && (
          <Button
            size="sm"
            variant="outline"
            className="self-start"
            onClick={() => update(c => {
              c.typography[at.gi].fonts[at.fi].specimens.push({
                label: 'Style', size: '18px', weight: '400',
                sample: 'The quick brown fox jumps over the lazy dog',
              })
            })}
          >
            <Icon name="plus" size={12} /> Add size
          </Button>
        )}
      </div>
    </CardDetail>
  )
}
