'use client'

import { useEffect, useRef, useState } from 'react'
import { useHub } from './HubContext'
import { Editable } from './Editable'
import { Icon } from './Icon'
import { trackPortal } from '../portal/track'
import { humanSize, localPreview, uploadAsset, uploadConfig } from './upload-client'
import { OrganicShimmer, useSmokyDissolve } from '../transitions'
import { filesFromDrop, filesFromInput } from './pick-files'
import { ImportReview } from './ImportReview'
import { useAssetImport } from './use-asset-import'
import type { AssetFile } from '@/app/types/brand'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  Attachment, AttachmentActions, AttachmentContent, AttachmentDescription,
  AttachmentMedia, AttachmentTitle,
} from '@/components/ui/attachment'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from '@/components/ui/empty'
import { Badge } from '@/components/ui/badge'
import { HubCard } from './HubCard'
import { SectionHeader } from './SectionHeader'
import { CardDetail } from './CardDetail'

/**
 * How much history one asset keeps.
 *
 * Unbounded, every replacement of a logo lived forever in a hub meant to hold
 * the approved file. Three is the useful window: what's live, what it replaced,
 * and the one before that to fall back to. Older ones drop off the end.
 */
const KEEP_VERSIONS = 3

function isImage(file: string): boolean {
  return /\.(svg|png|jpg|jpeg|webp|gif|ico)(\?|$)/i.test(file)
}

function isVideo(file: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(file)
}

/** Metadata tags on an asset: chips in view mode, editable in edit mode. */
function TagRow({ tags, onAdd, onRemove, editing }: { tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void; editing: boolean }) {
  const [draft, setDraft] = useState('')

  function commit() {
    const t = draft.trim().toLowerCase().replace(/[^a-z0-9\- ]/g, '').slice(0, 24)
    if (t && !tags.includes(t)) onAdd(t)
    setDraft('')
  }

  if (!editing && tags.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1 mb-2">
      {tags.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
          #{tag}
          {editing && (
            <button onClick={() => onRemove(tag)} className="text-muted-foreground/60 hover:text-destructive" title="Remove tag">×</button>
          )}
        </span>
      ))}
      {editing && (
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit() } }}
          onBlur={commit}
          placeholder="+ tag"
          size={Math.max(draft.length, 5)}
          className="text-[10px] px-1.5 py-0.5 rounded-md border border-dashed border-border outline-none focus:border-ring bg-transparent placeholder:text-muted-foreground/60"
        />
      )}
    </div>
  )
}

export function downloadHref(file: string): string {
  if (file.startsWith('/api/files/')) return `${file}?dl=1`
  // Blob-hosted files download instead of opening when asked to.
  if (file.includes('.blob.vercel-storage.com')) return `${file}${file.includes('?') ? '&' : '?'}download=1`
  return file
}

/**
 * What an empty section shows the person who can fill it.
 *
 * The old copy here — "check back soon, this section is being filled" — was
 * written for a visitor and shown to the owner who had just made the hub, on
 * the very first screen of the product. An editor gets the drop target
 * instead, and it accepts a drop whether or not Edit mode is switched on.
 */
function EmptyDropzone({
  onPickFiles, onPickFolder, dragOver, progress,
}: {
  onPickFiles: () => void
  onPickFolder: () => void
  dragOver: boolean
  progress: { done: number; total: number; name: string; percent: number } | null
}) {
  const [maxLabel, setMaxLabel] = useState('')
  const zoneRef = useRef<HTMLDivElement>(null)
  const puffsRef = useRef<SVGGElement>(null)

  useEffect(() => {
    // Cached after the first section, so this costs one request per page.
    uploadConfig().then(caps => setMaxLabel(humanSize(caps.maxBytes))).catch(() => {})
  }, [])

  if (progress) {
    const percent = progress.total === 1 ? progress.percent : (progress.done / progress.total) * 100
    return (
      <div className="border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center gap-4">
        {/* A working surface, not a spinner: the shimmer says "this is being
            processed" while the bar says how far in it is. */}
        <OrganicShimmer width={168} height={96} radius={12} playing />
        <p className="text-[14px] font-medium text-foreground">
          {progress.total === 1
            ? `${progress.name} · ${Math.round(progress.percent)}%`
            : `Uploading ${progress.done} of ${progress.total} · ${progress.name}`}
        </p>
        <span className="w-56 h-1 rounded-full bg-border overflow-hidden">
          <span className="block h-full bg-foreground transition-all" style={{ width: `${percent}%` }} />
        </span>
      </div>
    )
  }

  return (
    <div
      ref={zoneRef}
      className={`t-drop-zone app-dropzone relative flex w-full flex-col items-center justify-center gap-4 border-2 border-dashed rounded-2xl px-6 py-12 text-center text-balance transition-colors ${
        dragOver ? 'border-foreground bg-muted is-over' : 'border-border'
      }`}
    >
      {/* Smoke rings the drop physics squeezes out from under the landing. */}
      <svg className="t-drop-puffs" viewBox="0 0 204 204" aria-hidden="true" focusable="false">
        <g ref={puffsRef} className="t-drop-puff-group" filter="url(#t-drop-smoke)" />
      </svg>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon name="upload" size={16} />
        </EmptyMedia>
        <EmptyTitle className="text-[15px]">Drop files here</EmptyTitle>
        {/* Which section this is is the heading above it. The part worth
            saying is what a folder does, since that is the one outcome you
            can't guess from where you're standing. */}
        <EmptyDescription className="text-[13px]">
          A file, a .zip, or a whole folder. Folders are sorted across sections,
          and you’ll see the plan first.
        </EmptyDescription>
      </EmptyHeader>

      <EmptyContent className="flex-row flex-wrap justify-center">
        <Button variant="default" onClick={onPickFiles}>Choose files</Button>
        <Button variant="outline" onClick={onPickFolder}>Pick a whole folder</Button>
      </EmptyContent>

      <p className="text-[11.5px] text-muted-foreground/60 max-w-[46ch] mx-auto">
        Logos, source files, fonts, video and archives{maxLabel ? ` · up to ${maxLabel} per file` : ''}
      </p>
    </div>
  )
}

export function AssetsSection({ sectionId }: { sectionId: string }) {
  const { config, editing, canEdit, sandbox, allowDownload, portalId } = useHub()
  const [dragOver, setDragOver] = useState(false)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<AssetSort>('added')
  const [format, setFormat] = useState('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const inputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  // The pipeline itself lives in the hook, so the hub header can run the same
  // import without being inside a section. Here the section on screen is where
  // loose files land, which is what makes a plain drop skip the dialog.
  const {
    addFiles, confirmImport, cancelReview, review, progress, error, notice,
  } = useAssetImport({ fallbackSectionId: sectionId })

  // Folder pickers are opt-in per input and React has no prop for it, so the
  // attributes go on directly.
  useEffect(() => {
    const input = folderInputRef.current
    if (!input) return
    input.setAttribute('webkitdirectory', '')
    input.setAttribute('directory', '')
  }, [])

  const assets = config.assets[sectionId] || []
  const label = config.sections.find(s => s.id === sectionId)?.label || 'Assets'

  const hasLocalFiles = assets.some(a => a.file.startsWith('/'))

  // Pair each asset with where it really lives before touching the list, so
  // searching and sorting only change what is shown, never what a card writes.
  // Only the formats actually present, so the filter never offers a dead end.
  const formats = Array.from(new Set(assets.flatMap(a => a.format))).sort()
  const needle = query.trim().toLowerCase()
  const visible = assets
    .map((asset, i) => ({ asset, i }))
    .filter(({ asset }) => format === 'all' || asset.format.includes(format))
    .filter(({ asset }) => {
      if (!needle) return true
      const haystack = [asset.name, asset.usage || '', asset.subgroup || '', ...(asset.tags || []), ...asset.format]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
    .sort((a, b) => {
      if (sort === 'name') return a.asset.name.localeCompare(b.asset.name)
      if (sort === 'newest') return lastTouched(b.asset) - lastTouched(a.asset)
      return a.i - b.i
    })

  return (
    <div>
      {review && (
        <ImportReview
          buckets={review.buckets}
          sections={config.sections}
          scanning={review.scanning}
          onConfirm={confirmImport}
          onCancel={cancelReview}
        />
      )}
      <SectionHeader
        title={label}
        /* Both act on this section, and neither is the thing you came to the
           page to do — the files are. Two quiet buttons rather than one black
           one shouting over the heading it sits beside. */
        actions={
          <>
            {assets.length > 0 && hasLocalFiles && allowDownload && (
              <Button
                nativeButton={false}
                size="sm"
                variant="outline"
                render={
                  <a
                    href={`/api/hubs/${encodeURIComponent(config.slug)}/pack?section=${encodeURIComponent(sectionId)}`}
                    onClick={() => trackPortal(portalId, 'download', `${label} (.zip)`)}
                  />
                }
              >
                <Icon name="download" size={13} /> Download all
              </Button>
            )}
            {(canEdit || sandbox) && (
              <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} title={`Add files to ${label}`}>
                <Icon name="upload" size={13} /> Add to {label}
              </Button>
            )}
          </>
        }
        /* An empty section is described by the panel below it, not twice. */
        description={
          editing || assets.length > 0
            ? editing
              ? 'Drop files anywhere below. Click a name, note, or tag to edit it.'
              : sectionId === 'logo'
                ? 'The approved logo files, ready to download.'
                : `Everything in ${label}, ready to download.`
            : undefined
        }
        /* Searching and sorting only earn their space once there is enough to
           lose track of. Below that the list is the whole answer. Counted on
           what is stored, never on what is showing. */
        toolbar={assets.length > 3}
        search={{
          value: query,
          onChange: setQuery,
          placeholder: `Search ${label.toLowerCase()}…`,
          label: `Search ${label}`,
        }}
        filters={formats.length > 1 ? [{
          value: format,
          onChange: setFormat,
          label: 'Filter by format',
          className: 'w-32',
          options: [{ value: 'all', label: 'All formats' }, ...formats.map(f => ({ value: f, label: f }))],
        }] : []}
        sort={{
          value: sort,
          onChange: v => setSort(v as AssetSort),
          label: 'Sort files',
          options: (Object.keys(SORT_LABELS) as AssetSort[]).map(k => ({ value: k, label: SORT_LABELS[k] })),
        }}
        view={{ value: view, onChange: setView }}
      />


      {error && <p className="text-[13px] text-destructive mb-4">{error}</p>}
      {notice && <p className="text-[13px] text-muted-foreground mb-4">{notice}</p>}

      <div
        onDragOver={e => { if (canEdit) { e.preventDefault(); setDragOver(true) } }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          if (!canEdit) return
          e.preventDefault()
          setDragOver(false)
          filesFromDrop(e.dataTransfer).then(addFiles)
        }}
        className={`rounded-2xl transition-colors ${
          dragOver && assets.length > 0 ? 'bg-muted outline-2 outline-dashed outline-foreground' : ''
        }`}
      >
        {assets.length === 0 && canEdit ? (
          <EmptyDropzone
            onPickFiles={() => inputRef.current?.click()}
            onPickFolder={() => folderInputRef.current?.click()}
            dragOver={dragOver}
            progress={progress}
          />
        ) : assets.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
            <p className="text-[14px] font-medium text-muted-foreground mb-1">Nothing here yet</p>
            <p className="text-[12px] text-muted-foreground/60">Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* A search that matches nothing left an empty page with no reason
                given, which reads as the files having gone. */}
            {visible.length === 0 && (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Icon name="search" size={16} /></EmptyMedia>
                  <EmptyTitle className="text-[15px]">No files match “{query}”</EmptyTitle>
                  <EmptyDescription className="text-[13px]">
                    Searching names, notes, tags and formats in {label}.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent className="flex-row flex-wrap justify-center">
                  <Button variant="outline" onClick={() => setQuery('')}>Clear search</Button>
                </EmptyContent>
              </Empty>
            )}

            {(needle || sort !== 'added' || view === 'list' ? flatten(visible) : groupBySubgroup(visible)).map(({ subgroup, items }) => (
              <div key={subgroup || '_'}>
                {subgroup && (
                  // Same grey eyebrow the colour and gradient groups use, so a
                  // subgroup reads as a label rather than competing with the
                  // section heading above it.
                  <p className="text-[13px] font-medium text-muted-foreground mb-3">{subgroup}</p>
                )}
                <div className={view === 'list' ? 'flex flex-col gap-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch'}>
                  {items.map(({ asset, i }) => (
                    <AssetCard key={`${asset.file}-${i}`} asset={asset} index={i} sectionId={sectionId} view={view} />
                  ))}
                </div>
              </div>
            ))}

            {editing && (
              <button
                onClick={() => inputRef.current?.click()}
                className="w-full min-h-[120px] border-2 border-dashed border-border rounded-xl text-muted-foreground/60 hover:border-ring hover:text-foreground transition-colors flex flex-col items-center justify-center gap-2 p-6"
              >
                <Icon name="upload" size={20} />
                <span className="text-[13px] font-medium">
                  {progress
                    ? progress.total === 1
                      ? `${progress.name} · ${Math.round(progress.percent)}%`
                      : `Uploading ${progress.done}/${progress.total} · ${progress.name}`
                    : 'Add files'}
                </span>
                {progress ? (
                  <span className="w-40 h-1 rounded-full bg-border overflow-hidden">
                    <span
                      className="block h-full bg-foreground transition-all"
                      style={{ width: `${progress.total === 1 ? progress.percent : (progress.done / progress.total) * 100}%` }}
                    />
                  </span>
                ) : (
                  <span className="text-[11px]">drop files here, or click to browse</span>
                )}
              </button>
            )}

            {editing && !progress && (
              <button
                onClick={() => folderInputRef.current?.click()}
                className="w-full -mt-4 text-[12px] text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                or add a whole folder
              </button>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files?.length) addFiles(filesFromInput(e.target.files)); e.target.value = '' }}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files?.length) addFiles(filesFromInput(e.target.files)); e.target.value = '' }}
      />
    </div>
  )
}

/** Group assets by their `subgroup`, preserving order and original indices. */
/**
 * Group for display, over pairs that already carry their real index.
 *
 * A card writes back through `c.assets[sectionId][i]`, so the index has to be
 * the asset's position in the stored list, not its position in whatever the
 * filter left on screen. Taking pairs rather than an array is what stops a
 * search box turning "rename this" into "rename a different one".
 */
function groupBySubgroup(
  items: Array<{ asset: AssetFile; i: number }>
): Array<{ subgroup: string; items: Array<{ asset: AssetFile; i: number }> }> {
  const order: string[] = []
  const map = new Map<string, Array<{ asset: AssetFile; i: number }>>()
  for (const pair of items) {
    const key = pair.asset.subgroup || ''
    if (!map.has(key)) { map.set(key, []); order.push(key) }
    map.get(key)!.push(pair)
  }
  return order.map(subgroup => ({ subgroup, items: map.get(subgroup)! }))
}

/**
 * Subgroups only hold while the list is in its own order.
 *
 * Sorting by name inside "Logo", then again inside "Focus mark", is three
 * sorted lists rather than one, and a search that spans them reads as results
 * scattered under headings. Both cases want one run of files, so the headings
 * fold away and come back when the order does.
 */
function flatten(items: Array<{ asset: AssetFile; i: number }>) {
  return [{ subgroup: '', items }]
}

type AssetSort = 'added' | 'name' | 'newest'

/** Base UI's Value renders the raw value unless given something to show. */
const SORT_LABELS: Record<AssetSort, string> = {
  added: 'Order added',
  name: 'Name',
  newest: 'Recently updated',
}

/** Latest upload time on an asset, for sorting. 0 when it has no history. */
function lastTouched(asset: AssetFile): number {
  const stamps = (asset.versions || []).map(v => (v.uploadedAt ? Date.parse(v.uploadedAt) : 0))
  return stamps.length ? Math.max(...stamps) : 0
}

function AssetCard({ asset, index, sectionId, view = 'grid' }: {
  asset: AssetFile
  index: number
  sectionId: string
  /** A row instead of a tile. Same card, turned on its side. */
  view?: 'grid' | 'list'
}) {
  const { config, editing: sectionEditing, update, sandbox, canEdit, allowDownload, portalId } = useHub()
  const i = index
  const [copied, setCopied] = useState(false)
  // Editing one file used to switch the whole section on, so asking to rename
  // a logo put every card on the page into inputs. A card opens on its own;
  // the section-wide mode still opens all of them, for going through a batch.
  const [editingSelf, setEditingSelf] = useState(false)
  const editing = sectionEditing || editingSelf
  // One shape for every tile. Three different ones — 16:9, 3:4 and a fixed
  // 144px — meant a row of logos, a screenshot and a video were three heights,
  // and the cards under them never lined up. 4:3 is roomy enough for a wide
  // screenshot without cropping a portrait to nothing.
  const tileClass = 'aspect-[4/3]'
  const versions = asset.versions || []
  const current = asset.approvedVersion || versions[versions.length - 1]?.label
  const [showDetail, setShowDetail] = useState(false)
  const [uploadingVersion, setUploadingVersion] = useState(false)
  const versionInput = useRef<HTMLInputElement>(null)

  // Removing an asset plays the shred, then drops the data when it lands — so
  // the tile is still on screen for the fall. Reduced motion skips the animation
  // and calls onDone immediately, so the delete never depends on it running.
  const stageRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const smokeRef = useRef<HTMLCanvasElement>(null)
  const dissolve = useSmokyDissolve(stageRef, cardRef, smokeRef, {
    onDone: () => update(c => { c.assets[sectionId].splice(i, 1) }),
  })
  function dissolveThenRemove() {
    dissolve()
  }

  /** Upload a file as the next version and make it the approved one. */
  async function uploadVersion(file: File) {
    setUploadingVersion(true)
    try {
      const data = sandbox ? localPreview(file) : await uploadAsset(file, config.slug)
      update(c => {
        const a = c.assets[sectionId][i]
        const list = a.versions || []
        // Seed history with the original file the first time.
        if (list.length === 0) {
          list.push({ label: 'v1', file: a.file, format: a.format[0] || 'FILE', uploadedAt: new Date(0).toISOString() })
        }
        const label = `v${list.length + 1}`
        list.push({ label, file: data.url, format: data.format, uploadedAt: new Date().toISOString() })
        // Labels keep counting up; only the window slides.
        a.versions = list.slice(-KEEP_VERSIONS)
        a.approvedVersion = label
        a.file = data.url
        if (!a.format.includes(data.format)) a.format = [data.format, ...a.format]
      })
    } catch { /* keep the current version on failure */ } finally {
      setUploadingVersion(false)
    }
  }

  useEffect(() => {
    if (!editingSelf) return
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setEditingSelf(false) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [editingSelf])

  /** Somewhere else in this hub that holds files. */
  const otherSections = config.sections.filter(sec => sec.type === 'assets' && sec.id !== sectionId)

  function moveTo(targetId: string) {
    update(c => {
      const [moved] = c.assets[sectionId].splice(i, 1)
      if (!c.assets[targetId]) c.assets[targetId] = []
      c.assets[targetId].push(moved)
    })
  }

  /** The file's own address, which is what sharing one asset means here. */
  function copyLink() {
    const href = asset.file.startsWith('http') ? asset.file : `${window.location.origin}${asset.file}`
    navigator.clipboard.writeText(href)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  /** Make an older version the approved/current one. */
  function approve(label: string) {
    update(c => {
      const a = c.assets[sectionId][i]
      const v = (a.versions || []).find(x => x.label === label)
      if (!v) return
      a.approvedVersion = label
      a.file = v.file
    })
  }

  /** What this asset looks like — on the tile, and again larger in the detail,
   *  so a brand film is a film in both places and not a file icon in one. */
  const preview = isVideo(asset.file) ? (
    <video src={asset.file} className="w-full h-full object-cover" muted loop playsInline autoPlay preload="metadata" />
  ) : isImage(asset.file) ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset.file}
      alt={asset.name}
      className={`max-h-full max-w-full ${asset.ratio ? 'w-full h-full object-cover' : 'object-contain'}`}
      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  ) : (
    <Icon name="file" size={20} />
  )

  /**
   * Everything this card does, built once so the tile and the opened-up view
   * offer exactly the same set — nothing is reachable from only one of them.
   * `withVersions` is off inside the detail, where the history is already on
   * screen and the menu item would only lead back to itself.
   */
  function cardActions(withVersions: boolean) {
    return (
        <ButtonGroup className="shrink-0">
          {allowDownload && (
            <Button
              nativeButton={false}
              variant="outline"
              size="sm"
              title={asset.external ? `Open ${asset.name}` : `Download ${asset.name}`}
              render={
                <a
                  href={asset.external || asset.file.startsWith('http') ? asset.file : downloadHref(asset.file)}
                  {...(asset.external || asset.file.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : { download: true })}
                  onClick={() => trackPortal(portalId, 'download', asset.name)}
                />
              }
            >
              <Icon name={asset.external || asset.file.startsWith('http') ? 'link' : 'download'} size={14} />
              {asset.external || asset.file.startsWith('http') ? 'Open' : 'Download'}
            </Button>
          )}

          {(canEdit || sandbox) && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="icon-sm" aria-label={`Actions for ${asset.name}`}><Icon name="more" size={14} /></Button>}
              />
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setEditingSelf(true)}>
                    <Icon name="edit" size={14} />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyLink}>
                    <Icon name="share" size={14} />
                    {copied ? 'Link copied' : 'Copy link'}
                  </DropdownMenuItem>
                  {!asset.external && (
                    <DropdownMenuItem onClick={() => versionInput.current?.click()}>
                      <Icon name="upload" size={14} />
                      {uploadingVersion ? 'Uploading…' : 'Upload'}
                    </DropdownMenuItem>
                  )}
                  {withVersions && versions.length > 0 && (
                    <DropdownMenuItem onClick={() => setShowDetail(true)}>
                      <Icon name="history" size={14} />
                      Versions ({versions.length})
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>

                {otherSections.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Icon name="spaces" size={14} />
                        Move to section
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-48">
                        {otherSections.map(sec => (
                          <DropdownMenuItem key={sec.id} onClick={() => moveTo(sec.id)}>
                            <Icon name={sec.icon} size={14} />
                            {sec.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem variant="destructive" onClick={() => dissolveThenRemove()}>
                    <Icon name="trash" size={14} />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </ButtonGroup>
    )
  }

  return (
    <div ref={stageRef} className="t-smoky-stage asset-tile-stage">
    <HubCard
      ref={cardRef}
      className={`t-smoky-card asset-tile group relative ${view === 'list' ? 'sm:flex-row sm:items-stretch' : ''}`}
      mediaClassName={
        view === 'list'
          ? `aspect-[4/3] sm:aspect-auto sm:w-40 sm:shrink-0 ${isVideo(asset.file) ? 'p-0' : 'p-4'}`
          : `${tileClass} ${isVideo(asset.file) ? 'p-0' : 'p-6'}`
      }
      media={
        // The picture is the way in. It used to zoom on its own for photos and
        // do nothing at all for everything else, so half the library had no way
        // to be looked at properly.
        <button
          type="button"
          onClick={() => setShowDetail(true)}
          className="flex h-full w-full items-center justify-center"
          title={`Open ${asset.name}`}
          aria-label={`Open ${asset.name}`}
        >
          {preview}
        </button>
      }
      chips={
        <>
          {asset.platform && (
            <Badge variant="secondary">{asset.platform}</Badge>
          )}
          {asset.format.map(f => <Badge key={f} variant="secondary">{f}</Badge>)}
        </>
      }
      /**
       * Everything this card does, gathered where the button is.
       *
       * The actions used to be spread around: delete behind a hover cross in
       * the corner, renaming and tagging only reachable by switching the whole
       * section into Edit mode, and no way at all to move a file that landed
       * in the wrong place. A menu beside the download says what a card can do
       * without the page changing mode first.
       */
      action={cardActions(true)}
    >
      {/* Editing one card used to look identical to not editing it, give or
          take a dotted outline on a field. A bar says which card is open and
          how to close it. */}
      {editingSelf && (
        <div className="-mx-3 -mt-3 mb-2 flex items-center justify-between gap-2 border-b bg-muted px-3 py-1.5">
          <span className="text-muted-foreground">Editing this file</span>
          <Button size="xs" variant="outline" onClick={() => setEditingSelf(false)}>Done</Button>
        </div>
      )}
      <p className="text-[13px] font-medium text-foreground">
        <Editable editing={editing} value={asset.name} placeholder="Asset name" onChange={v => update(c => { c.assets[sectionId][i].name = v })} />
      </p>
      <div className="text-[11px] text-muted-foreground leading-tight">
        <Editable editing={editing} multiline value={asset.usage || ''} placeholder="Add a usage note" onChange={v => update(c => { c.assets[sectionId][i].usage = v })} />
      </div>
      <TagRow
        editing={editing}
        tags={asset.tags || []}
        onAdd={t => update(c => { const a = c.assets[sectionId][i]; a.tags = [...(a.tags || []), t] })}
        onRemove={t => update(c => { const a = c.assets[sectionId][i]; a.tags = (a.tags || []).filter(x => x !== t) })}
      />
      <input
        ref={versionInput}
        type="file"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadVersion(f); e.target.value = '' }}
      />
    </HubCard>

    {/* The card, opened up. A tile is deliberately small and every tile the
        same size, so the third line of a usage note is cut off and the artwork
        is a thumbnail. This is the same card with room — and the same actions,
        so opening something is never a detour away from doing anything with
        it. Versions used to be a dialog of their own; they are a section here,
        because two modals deep is where people lose track of what they are
        looking at. */}
    <CardDetail
      open={showDetail}
      onOpenChange={setShowDetail}
      title={
        <Editable editing={editing} value={asset.name} placeholder="Asset name" onChange={v => update(c => { c.assets[sectionId][i].name = v })} />
      }
      description={asset.subgroup}
      media={preview}
      mediaClassName={isVideo(asset.file) ? 'p-0' : 'p-6'}
      chips={
        <>
          {asset.platform && <Badge variant="secondary">{asset.platform}</Badge>}
          {asset.format.map(f => <Badge key={f} variant="secondary">{f}</Badge>)}
        </>
      }
      rows={[
        {
          label: 'Usage',
          value: editing
            ? <Editable editing multiline value={asset.usage || ''} placeholder="Add a usage note" onChange={v => update(c => { c.assets[sectionId][i].usage = v })} />
            : asset.usage || <span className="text-muted-foreground">No usage note yet</span>,
        },
        // Stored on every asset since the schema was written, shown nowhere.
        { label: 'Notes', value: asset.description },
      ]}
      actions={cardActions(false)}
    >
      <TagRow
        editing={editing}
        tags={asset.tags || []}
        onAdd={t => update(c => { const a = c.assets[sectionId][i]; a.tags = [...(a.tags || []), t] })}
        onRemove={t => update(c => { const a = c.assets[sectionId][i]; a.tags = (a.tags || []).filter(x => x !== t) })}
      />

      {versions.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[12px] text-muted-foreground">
            The last {KEEP_VERSIONS} uploads are kept. Uploading again adds one and drops the oldest.
          </p>
          {/* Newest first, one per row. AttachmentGroup is a horizontal
              scroller — right for a strip of files under a message, wrong for
              a history you read down. */}
          {[...versions].reverse().map(v => (
            <Attachment key={v.label} className="w-full">
              <AttachmentMedia className="overflow-hidden bg-muted">
                {isImage(v.file) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.file} alt="" className="size-full object-contain" />
                ) : (
                  <Icon name="file" size={14} />
                )}
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>
                  {v.label}
                  {v.label === current && <Badge variant="secondary">Current</Badge>}
                </AttachmentTitle>
                <AttachmentDescription>
                  {v.uploadedAt && new Date(v.uploadedAt).getFullYear() > 1971
                    ? new Date(v.uploadedAt).toLocaleDateString()
                    : 'original'}
                  {v.uploadedBy ? ` · ${v.uploadedBy}` : ''}
                </AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                {v.label !== current && (canEdit || sandbox) && (
                  <Button size="xs" variant="outline" onClick={() => approve(v.label)}>Make current</Button>
                )}
                {allowDownload && (
                  <Button
                    nativeButton={false}
                    size="icon-xs"
                    variant="ghost"
                    aria-label={`Download ${v.label}`}
                    render={<a href={downloadHref(v.file)} download />}
                  >
                    <Icon name="download" size={11} />
                  </Button>
                )}
              </AttachmentActions>
            </Attachment>
          ))}
        </div>
      )}
    </CardDetail>
    {/* The shred is drawn here, over the stage, once the card is snapshotted. */}
    <canvas ref={smokeRef} className="t-smoky-canvas" aria-hidden="true" />
    </div>
  )
}
