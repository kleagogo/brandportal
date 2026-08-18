'use client'

import { useEffect, useRef, useState } from 'react'
import { useHub } from './HubContext'
import { Editable } from './Editable'
import { Icon } from './Icon'
import { trackPortal } from '../portal/track'
import { humanSize, localPreview, uploadAsset, uploadConfig } from './upload-client'
import { ImageOpenTilt, OrganicShimmer, useSmokyDissolve } from '../transitions'
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
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from '@/components/ui/empty'
import { Badge } from '@/components/ui/badge'
import { HubCard } from './HubCard'

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
        <EmptyDescription className="text-[13px]">
          Single files, a .zip, or a whole folder. Drop a whole brand folder and
          it is sorted into the right sections, not piled into this one.
        </EmptyDescription>
      </EmptyHeader>

      <EmptyContent>
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
  const { config, editing, canEdit, allowDownload, portalId } = useHub()
  const [dragOver, setDragOver] = useState(false)
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
      <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
        <h1 className="text-[22px] font-bold tracking-tight">{label}</h1>
        {assets.length > 0 && hasLocalFiles && allowDownload && (
          <a
            href={`/api/hubs/${encodeURIComponent(config.slug)}/pack?section=${encodeURIComponent(sectionId)}`}
            onClick={() => trackPortal(portalId, 'download', `${label} (.zip)`)}
            className="flex items-center gap-1.5 text-[13px] font-semibold bg-primary text-primary-foreground px-3.5 py-2 rounded-xl hover:opacity-85 transition-colors"
          >
            <Icon name="download" size={13} /> Download all (.zip)
          </a>
        )}
      </div>
      {/* An empty section is described by the panel below it, not twice. */}
      {(editing || assets.length > 0) && (
        <p className="text-[14px] text-muted-foreground mb-8">
          {editing
            ? 'Drop files anywhere below. Click a name, note, or tag to edit it.'
            : sectionId === 'logo'
              ? 'The approved logo files, ready to download.'
              : `Everything in ${label}, ready to download.`}
        </p>
      )}
      {!editing && assets.length === 0 && <div className="mb-8" />}

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
            {groupBySubgroup(assets).map(({ subgroup, items }) => (
              <div key={subgroup || '_'}>
                {subgroup && (
                  // Same grey eyebrow the colour and gradient groups use, so a
                  // subgroup reads as a label rather than competing with the
                  // section heading above it.
                  <p className="text-[13px] font-medium text-muted-foreground mb-3">{subgroup}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                  {items.map(({ asset, i }) => (
                    <AssetCard key={`${asset.file}-${i}`} asset={asset} index={i} sectionId={sectionId} />
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
function groupBySubgroup(assets: AssetFile[]): Array<{ subgroup: string; items: Array<{ asset: AssetFile; i: number }> }> {
  const order: string[] = []
  const map = new Map<string, Array<{ asset: AssetFile; i: number }>>()
  assets.forEach((asset, i) => {
    const key = asset.subgroup || ''
    if (!map.has(key)) { map.set(key, []); order.push(key) }
    map.get(key)!.push({ asset, i })
  })
  return order.map(subgroup => ({ subgroup, items: map.get(subgroup)! }))
}

function AssetCard({ asset, index, sectionId }: { asset: AssetFile; index: number; sectionId: string }) {
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
  const [showHistory, setShowHistory] = useState(false)
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
    setShowHistory(false)
  }

  return (
    <div ref={stageRef} className="t-smoky-stage asset-tile-stage">
    <HubCard
      ref={cardRef}
      className="t-smoky-card asset-tile group relative"
      mediaClassName={`${tileClass} ${isVideo(asset.file) ? 'p-0' : 'p-6'}`}
      media={
        isImage(asset.file) && asset.ratio ? (
          // Photography and screenshots are worth looking at full size, so the
          // tile zooms open rather than only offering a download.
          <ImageOpenTilt src={asset.file} alt={asset.name} />
        ) : isVideo(asset.file) ? (
          // A brand film is the asset. Showing a file icon and asking someone to
          // download it to find out what it is defeats the point of the tile.
          <video
            src={asset.file}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
          />
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
      action={
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
                  {versions.length > 0 && (
                    <DropdownMenuItem onClick={() => setShowHistory(true)}>
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
      }
    >
      {/* Editing one card used to look identical to not editing it, give or
          take a dotted outline on a field. A bar says which card is open and
          how to close it. */}
      {editingSelf && (
        <div className="-mx-3 -mt-3 mb-1 flex items-center justify-between gap-2 border-b bg-muted px-3 py-1.5">
          <span className="text-muted-foreground">Editing this file</span>
          <Button size="xs" variant="outline" onClick={() => setEditingSelf(false)}>Done</Button>
        </div>
      )}
      <p className="text-[13px] font-medium text-foreground">
          <Editable value={asset.name} placeholder="Asset name" onChange={v => update(c => { c.assets[sectionId][i].name = v })} />
      </p>
      <p className="text-[11px] text-muted-foreground leading-tight">
        <Editable value={asset.usage || ''} placeholder="Add a usage note" onChange={v => update(c => { c.assets[sectionId][i].usage = v })} />
      </p>
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

    {/* Versions, where you can see them. This was a popover hanging off a text
        link inside the card, which meant the previous file was effectively
        unreachable: too small to show a preview, and gone on the next click. */}
    <Dialog open={showHistory} onOpenChange={setShowHistory}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{asset.name}</DialogTitle>
          <DialogDescription>
            The last {KEEP_VERSIONS} uploads are kept. Uploading again adds one and drops the oldest.
          </DialogDescription>
        </DialogHeader>

        {/* Newest first, one per row. AttachmentGroup is a horizontal
            scroller — right for a strip of files under a message, wrong for a
            history you read down. */}
        <div className="flex flex-col gap-2">
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
      </DialogContent>
    </Dialog>
    {/* The shred is drawn here, over the stage, once the card is snapshotted. */}
    <canvas ref={smokeRef} className="t-smoky-canvas" aria-hidden="true" />
    </div>
  )
}
