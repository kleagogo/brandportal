'use client'

import { useEffect, useRef, useState } from 'react'
import { useHub } from './HubContext'
import { Editable } from './Editable'
import { Icon } from './Icon'
import { trackPortal } from '../portal/track'
import { uploadAsset, uploadConfig } from './upload-client'
import {
  expandArchives,
  filesFromDrop,
  filesFromInput,
  splitByAllowed,
  stripCommonRoot,
  type PickedFile,
} from './pick-files'
import type { AssetFile } from '@/app/types/brand'

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
        <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[var(--hub-soft)] text-[var(--hub-muted)]">
          #{tag}
          {editing && (
            <button onClick={() => onRemove(tag)} className="text-[var(--hub-faint)] hover:text-red-500" title="Remove tag">×</button>
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
          className="text-[10px] px-1.5 py-0.5 rounded-md border border-dashed border-[var(--hub-border)] outline-none focus:border-[var(--hub-text)] bg-transparent placeholder:text-[var(--hub-faint)]"
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

export function AssetsSection({ sectionId }: { sectionId: string }) {
  const { config, editing, update, allowDownload, portalId } = useHub()
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
            className="flex items-center gap-1.5 text-[13px] font-semibold bg-[var(--hub-btn)] text-[var(--hub-btn-text)] px-3.5 py-2 rounded-xl hover:opacity-85 transition-colors"
          >
            <Icon name="download" size={13} /> Download all (.zip)
          </a>
        )}
      </div>
      <p className="text-[14px] text-[var(--hub-muted)] mb-8">
        {editing
          ? 'Drop files, folders, or a .zip anywhere below to add them, and click names, notes, or tags to edit.'
          : sectionId === 'logo'
            ? 'Our logo system. Download approved assets and follow usage guidelines.'
            : `${label} — download for presentations, product, and marketing.`}
      </p>

      {error && <p className="text-[13px] text-red-500 mb-4">{error}</p>}
      {notice && <p className="text-[13px] text-[var(--hub-muted)] mb-4">{notice}</p>}

      <div
        onDragOver={e => { if (editing) { e.preventDefault(); setDragOver(true) } }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          if (!editing) return
          e.preventDefault()
          setDragOver(false)
          filesFromDrop(e.dataTransfer).then(addFiles)
        }}
        className={`rounded-2xl transition-colors ${dragOver ? 'bg-[var(--hub-soft)] outline-2 outline-dashed outline-[#1a1a1a]' : ''}`}
      >
        {assets.length === 0 && !editing ? (
          <div className="border-2 border-dashed border-[var(--hub-border)] rounded-2xl p-12 text-center">
            <p className="text-[14px] font-medium text-[var(--hub-muted)] mb-1">No assets here yet</p>
            <p className="text-[12px] text-[var(--hub-faint)]">Check back soon — this section is being filled.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupBySubgroup(assets).map(({ subgroup, items }) => (
              <div key={subgroup || '_'}>
                {subgroup && <p className="text-[15px] font-semibold text-[var(--hub-text)] mb-3">{subgroup}</p>}
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
                className="w-full min-h-[120px] border-2 border-dashed border-[var(--hub-border)] rounded-xl text-[var(--hub-faint)] hover:border-[var(--hub-text)] hover:text-[var(--hub-text)] transition-colors flex flex-col items-center justify-center gap-2 p-6"
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
                  <span className="w-40 h-1 rounded-full bg-[var(--hub-border)] overflow-hidden">
                    <span
                      className="block h-full bg-[var(--hub-text)] transition-all"
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
                className="w-full -mt-4 text-[12px] text-[var(--hub-faint)] hover:text-[var(--hub-text)] transition-colors"
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
    <div className="bg-[var(--hub-panel)] border border-[var(--hub-border)] rounded-xl overflow-hidden group relative">
      {editing && (
        <button
          onClick={() => update(c => { c.assets[sectionId].splice(i, 1) })}
          className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-[var(--hub-panel)] border border-[var(--hub-border)] text-[var(--hub-muted)] hover:text-red-500 hover:border-red-300 items-center justify-center hidden group-hover:flex transition-colors"
          title="Remove asset"
        >
          <Icon name="close" size={11} />
        </button>
      )}
      {current && (
        <span className="absolute top-2 left-2 z-10 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white uppercase tracking-wide">
          {current} · Approved
        </span>
      )}
      <div className={`${tileClass} flex items-center justify-center bg-[var(--hub-tile)] border-b border-[var(--hub-border)] p-6 overflow-hidden`}>
        {isImage(asset.file) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.file}
            alt={asset.name}
            className={`max-h-full max-w-full ${asset.ratio ? 'w-full h-full object-cover' : 'object-contain'}`}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="w-12 h-12 bg-[var(--hub-soft)] rounded-lg flex items-center justify-center text-[var(--hub-muted)]">
            <Icon name="file" size={20} />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-[13px] font-medium text-[var(--hub-text)] mb-1">
          <Editable value={asset.name} placeholder="Asset name" onChange={v => update(c => { c.assets[sectionId][i].name = v })} />
        </p>
        <p className="text-[11px] text-[var(--hub-muted)] mb-2 leading-tight">
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
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--hub-soft)] text-[var(--hub-muted)] uppercase tracking-wide">{asset.platform}</span>
            )}
            {asset.format.map(f => (
              <span key={f} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--hub-soft)] text-[var(--hub-muted)]">{f}</span>
            ))}
          </div>
          {allowDownload && (
          <a
            href={asset.external || asset.file.startsWith('http') ? asset.file : downloadHref(asset.file)}
            {...(asset.external || asset.file.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : { download: true })}
            onClick={() => trackPortal(portalId, 'download', asset.name)}
            className="w-7 h-7 rounded-lg border border-[var(--hub-border)] flex items-center justify-center hover:bg-[var(--hub-btn)] hover:text-[var(--hub-btn-text)] hover:border-[var(--hub-text)] transition-colors text-[var(--hub-muted)] shrink-0"
            title={asset.external ? `Open ${asset.name}` : `Download ${asset.name}`}
          >
            <Icon name={asset.external || asset.file.startsWith('http') ? 'link' : 'download'} size={12} />
          </a>
          )}
        </div>

        {/* Versions — history for everyone, uploading for editors */}
        {(versions.length > 1 || editing) && (
          <div className="mt-2 pt-2 border-t border-dashed border-[var(--hub-border)] relative">
            <div className="flex items-center gap-3">
              {versions.length > 1 && (
                <button
                  onClick={() => setShowHistory(h => !h)}
                  className="text-[11px] font-medium text-[var(--hub-muted)] hover:text-[var(--hub-text)] transition-colors flex items-center gap-1"
                >
                  <Icon name="history" size={11} /> {versions.length} versions
                </button>
              )}
              {editing && !asset.external && (
                <button
                  onClick={() => versionInput.current?.click()}
                  className="text-[11px] font-medium text-[var(--hub-muted)] hover:text-[var(--hub-text)] transition-colors flex items-center gap-1 ml-auto"
                >
                  <Icon name="upload" size={11} /> {uploadingVersion ? 'Uploading…' : 'New version'}
                </button>
              )}
            </div>

            {showHistory && (
              <>
                <div className="fixed inset-0 z-20" onMouseDown={() => setShowHistory(false)} />
                <div className="absolute left-0 right-0 bottom-7 z-30 bg-[var(--hub-panel)] border border-[var(--hub-border)] rounded-xl shadow-xl overflow-hidden">
                  {[...versions].reverse().map(v => (
                    <div key={v.label} className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--hub-soft)] transition-colors">
                      <span className="text-[11px] font-mono font-semibold w-6 shrink-0">{v.label}</span>
                      <span className="text-[10px] text-[var(--hub-faint)] flex-1 min-w-0 truncate">
                        {v.uploadedAt && new Date(v.uploadedAt).getFullYear() > 1971 ? new Date(v.uploadedAt).toLocaleDateString() : 'original'}
                      </span>
                      {v.label === current ? (
                        <span className="text-[9px] font-bold text-emerald-600 uppercase shrink-0">Current</span>
                      ) : editing ? (
                        <button onClick={() => approve(v.label)} className="text-[10px] font-semibold text-[var(--hub-text)] hover:underline shrink-0">Make current</button>
                      ) : allowDownload ? (
                        <a href={downloadHref(v.file)} download className="text-[var(--hub-faint)] hover:text-[var(--hub-text)] shrink-0" title={`Download ${v.label}`}>
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
    </div>
  )
}
