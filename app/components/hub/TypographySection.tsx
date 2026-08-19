'use client'

import { useRef, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { FEATURED_FONTS, GOOGLE_FONTS } from './google-fonts'
import { addFontFile, isFontFile } from './font-files'
import { localPreview, uploadAsset } from './upload-client'
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
  const { config, editing, update, canEdit, sandbox, active, setEditingSection } = useHub()
  const { confirm, confirmDialog } = useConfirm()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('all')
  const [weight, setWeight] = useState('all')
  const [sort, setSort] = useState<FontSort>('added')
  const [copied, setCopied] = useState<string | null>(null)
  const [detail, setDetail] = useState<FontAt | null>(null)
  const [picker, setPicker] = useState(false)
  const [uploadingFonts, setUploadingFonts] = useState(0)
  const [fontError, setFontError] = useState('')
  const [dragOver, setDragOver] = useState(false)

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

  /**
   * Add a Google-hosted typeface by name and open it for editing. Seeds the
   * first group when there is none, so this always works.
   */
  function addGoogleTypeface(name: string, weights: string[]) {
    const gi = Math.max(0, config.typography.length - 1)
    const fi = config.typography[gi]?.fonts.length ?? 0
    const chosen = weights.length ? weights : ['400']
    update(c => {
      if (c.typography.length === 0) c.typography.push({ group: 'Brand typefaces', fonts: [] })
      c.typography[c.typography.length - 1].fonts.push({
        name,
        role: 'Typeface',
        weights: chosen,
        usage: '',
        importUrl: googleFontUrl(name, chosen),
        specimens: [{ label: 'Sample', size: '20px', weight: chosen[0], sample: 'The quick brown fox jumps over the lazy dog' }],
      })
    })
    setPicker(false)
    setDetail({ gi, fi })
  }

  /** Upload dropped or chosen font files and file each into a typeface. */
  async function addFontFiles(files: File[]) {
    const fonts = files.filter(f => isFontFile(f.name))
    if (!fonts.length) {
      setFontError('None of those are font files. OTF, TTF, WOFF and WOFF2 work.')
      return
    }
    setFontError('')
    setUploadingFonts(fonts.length)
    // Where the last file landed, so the typeface can open when the batch is
    // done — showing the weights the filenames carried, ready to adjust.
    let landed: FontAt | null = null
    for (const file of fonts) {
      try {
        const data = sandbox ? localPreview(file) : await uploadAsset(file, config.slug)
        update(c => {
          const font = addFontFile(c, file.name, data.url)
          for (let gi = 0; gi < c.typography.length; gi++) {
            const fi = c.typography[gi].fonts.indexOf(font)
            if (fi !== -1) { landed = { gi, fi }; break }
          }
        })
      } catch {
        setFontError(prev => prev || `Couldn’t upload ${file.name}`)
      } finally {
        setUploadingFonts(n => n - 1)
      }
    }
    setPicker(false)
    if (landed) setDetail(landed)
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
    // A group with nothing in it shows while editing — it was just created
    // and needs to be seen to be named or filled.
    .filter(g => g.items.length > 0 || (editing && group === 'all' && weight === 'all' && !needle))

  const open = detail ? config.typography[detail.gi]?.fonts[detail.fi] : undefined
  const openGroup = detail ? config.typography[detail.gi]?.group : undefined

  return (
    <div
      className={dragOver ? 'rounded-xl ring-2 ring-ring ring-offset-4' : ''}
      onDragOver={e => {
        if (!(canEdit || sandbox)) return
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        if (!(canEdit || sandbox)) return
        e.preventDefault()
        setDragOver(false)
        addFontFiles(Array.from(e.dataTransfer.files))
      }}
    >
      {confirmDialog}

      <SectionHeader
        title={label}
        description={
          editing
            ? 'Click a typeface to open it. Google Fonts load automatically by name.'
            : 'Our typefaces, weights, and how to use them.'
        }
        actions={
          (canEdit || sandbox) && (
            <>
              <Button size="sm" variant="outline" onClick={() => setPicker(true)}>
                <Icon name="plus" size={13} /> Add typeface
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingSection(active)
                  update(c => { c.typography.push({ group: 'New group', fonts: [] }) })
                }}
              >
                <Icon name="plus" size={13} /> Add group
              </Button>
            </>
          )
        }
        toolbar={total > 3}
        search={{
          value: query,
          onChange: setQuery,
          placeholder: 'Search…',
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

      {uploadingFonts > 0 && (
        <p className="mb-4 text-[13px] text-muted-foreground">
          Adding {uploadingFonts} font file{uploadingFonts === 1 ? '' : 's'}…
        </p>
      )}
      {fontError && <p className="mb-4 text-[13px] text-destructive">{fontError}</p>}

      {total === 0 && !editing && (
        <EmptyState
          title="No typefaces yet"
          description="Add the fonts the brand is set in, with the weights and sizes that go with them."
          actionLabel="Add a typeface"
          onAction={() => setPicker(true)}
        />
      )}

      {total > 0 && groups.length === 0 && (
        <p className="text-[13px] text-muted-foreground">No typefaces match that.</p>
      )}

      {groups.map(({ gi, items }) => (
        <div key={gi} className="mb-6">

          {/* Room for a family's whole weight run — at full page width,
              three-up is already wider than the old capped two-up. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      {picker && (
        <TypefacePicker
          onClose={() => setPicker(false)}
          onPick={addGoogleTypeface}
          onFiles={addFontFiles}
        />
      )}

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


/**
 * Where a typeface comes from: Google Fonts by name, or the files themselves.
 *
 * Two steps, because a family is not a decision yet — the weights are.
 * Each listed family carries its real coverage, and the second step offers
 * exactly that, which also stops single-weight faces like Bebas Neue being
 * requested at weights they don't have (the stylesheet endpoint rejects the
 * whole request over one bad weight).
 *
 * The browse list stays short until someone types: eight families, one taste
 * of each shelf. Free text is still accepted — any Google family loads by
 * name — with all nine weights offered and 400 preselected, since coverage
 * for an unlisted family is its own business.
 */
function TypefacePicker({
  onClose, onPick, onFiles,
}: {
  onClose: () => void
  onPick: (name: string, weights: string[]) => void
  onFiles: (files: File[]) => void
}) {
  const [query, setQuery] = useState('')
  // Step two: a family has been chosen; now the weights.
  const [chosen, setChosen] = useState<{ name: string; offered: string[]; known: boolean } | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const fileInput = useRef<HTMLInputElement>(null)

  const needle = query.trim().toLowerCase()
  const matches = needle
    ? GOOGLE_FONTS.filter(f => f.name.toLowerCase().includes(needle))
    : GOOGLE_FONTS.filter(f => FEATURED_FONTS.includes(f.name))
  const exact = GOOGLE_FONTS.some(f => f.name.toLowerCase() === needle)

  function choose(font: { name: string; weights: string[] } | { name: string }) {
    const offered = 'weights' in font ? font.weights : ALL_WEIGHTS
    const known = 'weights' in font
    setChosen({ name: font.name, offered, known })
    // Regular and a heading weight when the family has them; otherwise
    // whatever it does have.
    setPicked(['400', '600'].filter(w => offered.includes(w)).length
      ? ['400', '600'].filter(w => offered.includes(w))
      : [offered[0]])
  }

  return (
    <Dialog open onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{chosen ? chosen.name : 'Add a typeface'}</DialogTitle>
          <DialogDescription>
            {chosen
              ? chosen.known
                ? 'Pick the weights to bring in. You can change these later.'
                : 'Pick the weights this family offers on Google Fonts.'
              : 'Pick from Google Fonts, or upload the font files you have.'}
          </DialogDescription>
        </DialogHeader>

        {chosen ? (
          <>
            <div className="flex flex-wrap gap-1.5">
              {chosen.offered.map(w => {
                const active = picked.includes(w)
                return (
                  <Button
                    key={w}
                    size="xs"
                    variant={active ? 'default' : 'outline'}
                    onClick={() => setPicked(prev => active ? prev.filter(x => x !== w) : [...prev, w].sort((a, b) => Number(a) - Number(b)))}
                    title={`Weight ${w}`}
                  >
                    {w}
                  </Button>
                )
              })}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setChosen(null)}>Back</Button>
              <Button disabled={picked.length === 0} onClick={() => onPick(chosen.name, picked)}>
                Add {chosen.name}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground">
                <Icon name="search" size={14} />
              </span>
              <Input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search Google Fonts…"
                className="pl-8"
                aria-label="Search Google Fonts"
                onKeyDown={e => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  if (matches.length > 0) choose(matches[0])
                  else if (query.trim()) choose({ name: query.trim() })
                }}
              />
            </div>

            <div className="flex max-h-[40vh] flex-col gap-0.5 overflow-y-auto">
              {matches.map(f => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => choose(f)}
                  className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted"
                >
                  <span className="text-[13px] font-medium">{f.name}</span>
                  <span className="text-[11px] text-muted-foreground">{f.category}</span>
                </button>
              ))}
              {!needle && (
                <p className="px-2.5 py-1.5 text-[11px] text-muted-foreground/60">
                  A few favourites. Search for the rest — every Google Font works.
                </p>
              )}
              {/* The catalogue is bigger than this list; a miss is still a font. */}
              {needle && !exact && query.trim() && (
                <button
                  type="button"
                  onClick={() => choose({ name: query.trim() })}
                  className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted"
                >
                  <span className="text-[13px] font-medium">Use “{query.trim()}”</span>
                  <span className="text-[11px] text-muted-foreground">Any Google Font works by name</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t pt-4">
              <p className="text-[12px] text-muted-foreground">
                Have the files? OTF, TTF, WOFF and WOFF2.
              </p>
              <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                <Icon name="upload" size={13} /> Upload font files
              </Button>
            </div>
          </>
        )}

        <input
          ref={fileInput}
          type="file"
          multiple
          accept=".otf,.ttf,.woff,.woff2,.eot"
          className="hidden"
          onChange={e => { if (e.target.files?.length) onFiles(Array.from(e.target.files)); e.target.value = '' }}
        />
      </DialogContent>
    </Dialog>
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
  const { config, editing, update, allowDownload, canEdit, sandbox, active, setEditingSection } = useHub()
  const mayEdit = canEdit || sandbox
  const font = config.typography[at.gi]?.fonts[at.fi]
  if (!font) return null
  const key = `${at.gi}:${at.fi}`
  const face = { fontFamily: `'${font.name}', sans-serif` }

  return (
    <CardDetail
      open
      onOpenChange={o => { if (!o) onClose() }}
      className="sm:max-w-[600px]"
      title={<span style={face}>{font.name}</span>}
      description={groupName}
      /* leading-none clipped the g's descender against the band's own
         overflow; the taller line box keeps the whole glyph. */
      media={<span className="text-[96px] leading-[1.15] text-foreground" style={face}>Ag</span>}
      mediaClassName="py-2"
      chips={font.weights.map(w => <Badge key={w} variant="secondary">{w}</Badge>)}
      rows={editing ? [] : [
        { label: 'Role', value: font.primaryLabel || font.role },
        { label: 'Usage', value: font.usage },
        { label: 'About', value: font.description },
        {
          label: 'Source',
          value: font.importUrl
            ? 'Google Fonts'
            : (font.downloads || []).some(d => d.file) ? 'Uploaded files' : null,
        },
        { label: 'CSS', value: cssFor(font), mono: true },
      ]}
      /* The same pair the card wears, exactly — opening a card must never
         change what it can do. The menu keeps Edit and Delete; the weight
         chips appear once Edit is on. */
      actions={
        <ButtonGroup className="shrink-0">
          <Button variant="outline" onClick={onCopy}>
            <Icon name="copy" size={14} /> {copiedKey === key ? 'Copied' : 'Copy CSS'}
          </Button>
          {mayEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="icon" aria-label={`Actions for ${font.name}`}>
                    <Icon name="more" size={14} />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  {!editing && (
                    <DropdownMenuItem onClick={() => setEditingSection(active)}>
                      <Icon name="edit" size={14} /> Edit typeface
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onCopy}>
                    <Icon name="copy" size={14} /> Copy CSS
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem variant="destructive" onClick={onDelete}>
                    <Icon name="trash" size={14} /> Delete
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </ButtonGroup>
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
                // Only Google-hosted faces have a stylesheet URL to rebuild;
                // an uploaded font renaming itself must not grow one.
                if (f.importUrl) f.importUrl = googleFontUrl(f.name, f.weights)
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
            <Label htmlFor="font-description">Description</Label>
            <Textarea
              id="font-description"
              value={font.description || ''}
              rows={2}
              placeholder="Anything worth knowing — where it came from, its licence, when to reach for it."
              onChange={e => update(c => { c.typography[at.gi].fonts[at.fi].description = e.target.value })}
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
                      if (f.importUrl) f.importUrl = googleFontUrl(f.name, f.weights)
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

      {/* Every weight, shown as itself — adding eight weights to Manrope
          should show eight Manropes, not a row of numbers. Read mode only:
          the edit form has its own Weights block, the toggles, and two
          sections wearing the same label is one too many. */}
      {!editing && (
      <div className="flex flex-col gap-1.5">
        <Label>Weights</Label>
        {font.weights.length === 0 && (
          <p className="text-[13px] text-muted-foreground">No weights picked yet.</p>
        )}
        {font.weights.map(w => (
          <div key={w} className="flex items-baseline gap-3 rounded-lg border border-border bg-background px-3 py-2">
            <span className="w-8 shrink-0 font-mono text-[11px] text-muted-foreground">{w}</span>
            <span
              className="truncate text-[17px] leading-snug text-foreground"
              style={{ ...face, fontWeight: Number(w) || 400 }}
            >
              The quick brown fox jumps over the lazy dog
            </span>
          </div>
        ))}
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
