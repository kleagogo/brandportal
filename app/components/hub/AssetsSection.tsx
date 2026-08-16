'use client'

import { useEffect, useRef, useState } from 'react'
import { useHub } from './HubContext'
import { Editable } from './Editable'
import { Icon } from './Icon'
import { trackPortal } from '../portal/track'
import { humanSize, uploadAsset, uploadConfig } from './upload-client'
import { ImageOpenTilt, OrganicShimmer, useSmokyDissolve } from '../transitions'
import {
  expandArchives,
  filesFromDrop,
  filesFromInput,
  splitByAllowed,
  stripCommonRoot,
  type PickedFile,
} from './pick-files'
import type { AssetFile } from '@/app/types/brand'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/** How many files to upload at once. Enough to keep the pipe busy, not so
 *  many that a folder of 300 logos opens 300 sockets. */
const CONCURRENCY = 4

function isImage(file: string): boolean {
  return /\.(svg|png|jpg|jpeg|webp|gif|ico)(\?|$)/i.test(file)
}

/** Metadata tags on an asset: chips in view mode, editable in edit mode. */
function TagRow({ tags, onAdd, onRemove }: { tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void }) {
  const { editing } = useHub()
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
            ? `${progress.name} — ${Math.round(progress.percent)}%`
            : `Uploading ${progress.done} of ${progress.total} — ${progress.name}`}
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
      className={`t-drop-zone app-dropzone border-2 border-dashed rounded-2xl px-6 py-12 text-center transition-colors ${
        dragOver ? 'border-foreground bg-muted is-over' : 'border-border'
      }`}
    >
      {/* Smoke rings the drop physics squeezes out from under the landing. */}
      <svg className="t-drop-puffs" viewBox="0 0 204 204" aria-hidden="true" focusable="false">
        <g ref={puffsRef} className="t-drop-puff-group" filter="url(#t-drop-smoke)" />
      </svg>
      <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-muted text-muted-foreground mb-4">
        <Icon name="upload" size={19} />
      </span>
      <p className="text-[16px] font-semibold text-foreground mb-1.5">Drop files here</p>
      <p className="text-[13.5px] text-muted-foreground leading-relaxed max-w-[42ch] mx-auto mb-6">
        Drag in files, a whole folder, or a .zip. Folders keep their structure as groups, and
        archives are unpacked for you.
      </p>

      <div className="flex items-center justify-center gap-2 flex-wrap mb-7">
        <button
          onClick={onPickFiles}
          className="text-[13px] font-semibold bg-primary text-primary-foreground px-4 py-2.5 rounded-xl hover:opacity-85 transition-opacity"
        >
          Choose files
        </button>
        <button
          onClick={onPickFolder}
          className="text-[13px] font-semibold bg-highlight text-highlight-foreground px-4 py-2.5 rounded-xl hover:brightness-95 transition-all"
        >
          Choose a folder
        </button>
      </div>

      <div className="border-t border-border pt-5 max-w-[46ch] mx-auto">
        <p className="text-[12.5px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Coming from Google Drive?</span>{' '}
          Open the client&rsquo;s folder, hit Download — Drive hands you a .zip — and drop that
          straight in here.
        </p>
        <p className="text-[11.5px] text-muted-foreground/60 mt-3">
          Logos, source files, fonts, video and archives{maxLabel ? ` · up to ${maxLabel} per file` : ''}
        </p>
      </div>
    </div>
  )
}

export function AssetsSection({ sectionId }: { sectionId: string }) {
  const { config, editing, update, canEdit, allowDownload, portalId } = useHub()
  const [progress, setProgress] = useState<{ done: number; total: number; name: string; percent: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

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

  /**
   * Take everything the user picked — files, folders, archives — and add it.
   *
   * Archives are opened and folders flattened first, so what gets uploaded is
   * always plain files; the folder each one came from is kept as its subgroup
   * so a dropped brand folder arrives organised rather than as a heap.
   */
  async function addFiles(picked: PickedFile[]) {
    setError('')
    setNotice('')
    if (!picked.length) return

    const caps = await uploadConfig()
    const prepared = stripCommonRoot(await expandArchives(picked))
    const { usable, skipped } = splitByAllowed(prepared, caps.allowed)

    if (!usable.length) {
      setError(skipped
        ? `None of those ${skipped} file${skipped > 1 ? 's are' : ' is'} a supported type`
        : 'Nothing to upload')
      return
    }

    const total = usable.length
    const queue = [...usable]
    const failed: string[] = []
    let done = 0
    setProgress({ done: 0, total, name: usable[0].file.name, percent: 0 })

    async function worker() {
      for (;;) {
        const item = queue.shift()
        if (!item) return
        try {
          // Per-file percentages only mean something when there's one file;
          // in a batch the count is the useful signal.
          const data = await uploadAsset(
            item.file,
            config.slug,
            total === 1 ? percent => setProgress({ done, total, name: item.file.name, percent }) : undefined
          )
          const asset: AssetFile = {
            name: data.suggestion?.name || item.file.name.replace(/\.[^.]*$/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()),
            file: data.url,
            format: [data.format],
            usage: data.suggestion?.usage || '',
            tags: data.suggestion?.tags || [],
            ...(item.path ? { subgroup: item.path } : {}),
          }
          update(c => {
            if (!c.assets[sectionId]) c.assets[sectionId] = []
            c.assets[sectionId].push(asset)
          })
        } catch (e) {
          failed.push(item.file.name)
          // Keep the first real reason; the rest are usually the same one.
          setError(prev => prev || (e instanceof Error ? e.message : 'Upload failed'))
        } finally {
          done++
          setProgress({ done, total, name: item.file.name, percent: 100 })
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, total) }, worker))
    setProgress(null)

    const added = total - failed.length
    const parts: string[] = []
    if (added) parts.push(`${added} file${added > 1 ? 's' : ''} added`)
    if (failed.length) parts.push(`${failed.length} failed`)
    if (skipped) parts.push(`${skipped} skipped as unsupported`)
    if (added && !editing) parts.push('hit Edit to rename or tag them')
    if (parts.length > 1 || skipped) setNotice(parts.join(' · '))
  }

  const hasLocalFiles = assets.some(a => a.file.startsWith('/'))

  return (
    <div>
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
            ? 'Drop files, folders, or a .zip anywhere below to add them, and click names, notes, or tags to edit.'
            : sectionId === 'logo'
              ? 'Our logo system. Download approved assets and follow usage guidelines.'
              : `${label} — download for presentations, product, and marketing.`}
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
            <p className="text-[12px] text-muted-foreground/60">This section hasn&rsquo;t been filled in.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupBySubgroup(assets).map(({ subgroup, items }) => (
              <div key={subgroup || '_'}>
                {subgroup && <p className="text-[15px] font-semibold text-foreground mb-3">{subgroup}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      ? `${progress.name} — ${Math.round(progress.percent)}%`
                      : `Uploading ${progress.done}/${progress.total} — ${progress.name}`
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
                  <span className="text-[11px]">drop files, a folder, or a .zip — or click to browse</span>
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
  const { config, editing, update, allowDownload, portalId } = useHub()
  const i = index
  const tileClass = asset.ratio === 'wide' ? 'aspect-video' : asset.ratio === 'portrait' ? 'aspect-[3/4]' : 'h-36'
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
      const data = await uploadAsset(file, config.slug)
      update(c => {
        const a = c.assets[sectionId][i]
        const list = a.versions || []
        // Seed history with the original file the first time.
        if (list.length === 0) {
          list.push({ label: 'v1', file: a.file, format: a.format[0] || 'FILE', uploadedAt: new Date(0).toISOString() })
        }
        const label = `v${list.length + 1}`
        list.push({ label, file: data.url, format: data.format, uploadedAt: new Date().toISOString() })
        a.versions = list
        a.approvedVersion = label
        a.file = data.url
        if (!a.format.includes(data.format)) a.format = [data.format, ...a.format]
      })
    } catch { /* keep the current version on failure */ } finally {
      setUploadingVersion(false)
    }
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
    <Card ref={cardRef} size="sm" className="t-smoky-card asset-tile gap-0 py-0 group relative">
      {editing && (
        <button
          onClick={() => dissolveThenRemove()}
          className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-card border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 items-center justify-center hidden group-hover:flex transition-colors"
          title="Remove asset"
        >
          <Icon name="close" size={11} />
        </button>
      )}
      {current && (
        <span className="absolute top-2 left-2 z-10 text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary text-primary-foreground uppercase tracking-wide">
          {current} · Approved
        </span>
      )}
      <div className={`${tileClass} flex items-center justify-center bg-muted border-b border-border p-6 overflow-hidden`}>
        {isImage(asset.file) && asset.ratio ? (
          // Photography and screenshots are worth looking at full size, so the
          // tile zooms open rather than only offering a download.
          <ImageOpenTilt src={asset.file} alt={asset.name} />
        ) : isImage(asset.file) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.file}
            alt={asset.name}
            className={`max-h-full max-w-full ${asset.ratio ? 'w-full h-full object-cover' : 'object-contain'}`}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
            <Icon name="file" size={20} />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-[13px] font-medium text-foreground mb-1">
          <Editable value={asset.name} placeholder="Asset name" onChange={v => update(c => { c.assets[sectionId][i].name = v })} />
        </p>
        <p className="text-[11px] text-muted-foreground mb-2 leading-tight">
          <Editable value={asset.usage || ''} placeholder="Add a usage note" onChange={v => update(c => { c.assets[sectionId][i].usage = v })} />
        </p>
        <TagRow
          tags={asset.tags || []}
          onAdd={t => update(c => { const a = c.assets[sectionId][i]; a.tags = [...(a.tags || []), t] })}
          onRemove={t => update(c => { const a = c.assets[sectionId][i]; a.tags = (a.tags || []).filter(x => x !== t) })}
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-1 items-center flex-wrap">
            {asset.platform && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wide">{asset.platform}</span>
            )}
            {asset.format.map(f => (
              <span key={f} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{f}</span>
            ))}
          </div>
          {allowDownload && (
          <Button
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground"
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
        </div>

        {/* Versions — history for everyone, uploading for editors */}
        {(versions.length > 1 || editing) && (
          <div className="mt-2 pt-2 border-t border-dashed border-border relative">
            <div className="flex items-center gap-3">
              {versions.length > 1 && (
                <button
                  onClick={() => setShowHistory(h => !h)}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Icon name="history" size={11} /> {versions.length} versions
                </button>
              )}
              {editing && !asset.external && (
                <button
                  onClick={() => versionInput.current?.click()}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 ml-auto"
                >
                  <Icon name="upload" size={11} /> {uploadingVersion ? 'Uploading…' : 'New version'}
                </button>
              )}
            </div>

            {showHistory && (
              <>
                <div className="fixed inset-0 z-20" onMouseDown={() => setShowHistory(false)} />
                <div className="absolute left-0 right-0 bottom-7 z-30 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                  {[...versions].reverse().map(v => (
                    <div key={v.label} className="flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors">
                      <span className="text-[11px] font-mono font-semibold w-6 shrink-0">{v.label}</span>
                      <span className="text-[10px] text-muted-foreground/60 flex-1 min-w-0 truncate">
                        {v.uploadedAt && new Date(v.uploadedAt).getFullYear() > 1971 ? new Date(v.uploadedAt).toLocaleDateString() : 'original'}
                      </span>
                      {v.label === current ? (
                        <span className="text-[9px] font-bold text-primary uppercase shrink-0">Current</span>
                      ) : editing ? (
                        <button onClick={() => approve(v.label)} className="text-[10px] font-semibold text-foreground hover:underline shrink-0">Make current</button>
                      ) : allowDownload ? (
                        <a href={downloadHref(v.file)} download className="text-muted-foreground/60 hover:text-foreground shrink-0" title={`Download ${v.label}`}>
                          <Icon name="download" size={11} />
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </>
            )}

            <input
              ref={versionInput}
              type="file"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadVersion(f); e.target.value = '' }}
            />
          </div>
        )}
      </div>
    </Card>
    {/* The shred is drawn here, over the stage, once the card is snapshotted. */}
    <canvas ref={smokeRef} className="t-smoky-canvas" aria-hidden="true" />
    </div>
  )
}
