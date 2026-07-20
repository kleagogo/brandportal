'use client'

import { useRef, useState } from 'react'
import { useHub } from './HubContext'
import { Editable } from './Editable'
import { Icon } from './Icon'
import type { AssetFile } from '@/app/types/brand'

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

function downloadHref(file: string): string {
  return file.startsWith('/api/files/') ? `${file}?dl=1` : file
}

export function AssetsSection({ sectionId }: { sectionId: string }) {
  const { config, editing, update } = useHub()
  const [uploading, setUploading] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const assets = config.assets[sectionId] || []
  const label = config.sections.find(s => s.id === sectionId)?.label || 'Assets'

  async function uploadFiles(files: FileList | File[]) {
    setError('')
    const list = Array.from(files)
    setUploading(u => u + list.length)
    for (const file of list) {
      try {
        const form = new FormData()
        form.append('file', file)
        form.append('slug', config.slug)
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Upload failed')
        // If Claude described the image, its name/tags/usage prefill the card.
        const asset: AssetFile = {
          name: data.suggestion?.name || file.name.replace(/\.[^.]*$/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()),
          file: data.url,
          format: [data.format],
          usage: data.suggestion?.usage || '',
          tags: data.suggestion?.tags || [],
        }
        update(c => {
          if (!c.assets[sectionId]) c.assets[sectionId] = []
          c.assets[sectionId].push(asset)
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed')
      } finally {
        setUploading(u => u - 1)
      }
    }
  }

  const hasLocalFiles = assets.some(a => a.file.startsWith('/'))

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
        <h1 className="text-[22px] font-bold tracking-tight">{label}</h1>
        {assets.length > 0 && hasLocalFiles && (
          <a
            href={`/api/hubs/${encodeURIComponent(config.slug)}/pack?section=${encodeURIComponent(sectionId)}`}
            className="flex items-center gap-1.5 text-[13px] font-semibold bg-[var(--hub-btn)] text-[var(--hub-btn-text)] px-3.5 py-2 rounded-xl hover:opacity-85 transition-colors"
          >
            <Icon name="download" size={13} /> Download all (.zip)
          </a>
        )}
      </div>
      <p className="text-[14px] text-[var(--hub-muted)] mb-8">
        {editing
          ? 'Drop files anywhere below to add them, and click names, notes, or tags to edit.'
          : sectionId === 'logo'
            ? 'Our logo system. Download approved assets and follow usage guidelines.'
            : `${label} — download for presentations, product, and marketing.`}
      </p>

      {error && <p className="text-[13px] text-red-500 mb-4">{error}</p>}

      <div
        onDragOver={e => { if (editing) { e.preventDefault(); setDragOver(true) } }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          if (!editing) return
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files)
        }}
        className={`rounded-2xl transition-colors ${dragOver ? 'bg-[var(--hub-soft)] outline-2 outline-dashed outline-[#1a1a1a]' : ''}`}
      >
        {assets.length === 0 && !editing ? (
          <div className="border-2 border-dashed border-[var(--hub-border)] rounded-2xl p-12 text-center">
            <p className="text-[14px] font-medium text-[var(--hub-muted)] mb-1">No assets here yet</p>
            <p className="text-[12px] text-[var(--hub-faint)]">Check back soon — this section is being filled.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset, i) => (
              <div key={`${asset.file}-${i}`} className="bg-[var(--hub-panel)] border border-[var(--hub-border)] rounded-xl overflow-hidden group relative">
                {editing && (
                  <button
                    onClick={() => update(c => { c.assets[sectionId].splice(i, 1) })}
                    className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-[var(--hub-panel)] border border-[var(--hub-border)] text-[var(--hub-muted)] hover:text-red-500 hover:border-red-300 items-center justify-center hidden group-hover:flex transition-colors"
                    title="Remove asset"
                  >
                    <Icon name="close" size={11} />
                  </button>
                )}
                <div className="h-36 flex items-center justify-center bg-[var(--hub-tile)] border-b border-[var(--hub-border)] p-6">
                  {isImage(asset.file) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.file}
                      alt={asset.name}
                      className="max-h-full max-w-full object-contain"
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
                    <div className="flex gap-1">
                      {asset.format.map(f => (
                        <span key={f} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--hub-soft)] text-[var(--hub-muted)]">{f}</span>
                      ))}
                    </div>
                    <a
                      href={downloadHref(asset.file)}
                      download
                      className="w-7 h-7 rounded-lg border border-[var(--hub-border)] flex items-center justify-center hover:bg-[#1a1a1a] hover:text-white hover:border-[var(--hub-text)] transition-colors text-[var(--hub-muted)]"
                      title={`Download ${asset.name}`}
                    >
                      <Icon name="download" size={12} />
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {editing && (
              <button
                onClick={() => inputRef.current?.click()}
                className="min-h-[220px] border-2 border-dashed border-[var(--hub-border)] rounded-xl text-[var(--hub-faint)] hover:border-[var(--hub-text)] hover:text-[var(--hub-text)] transition-colors flex flex-col items-center justify-center gap-2 p-6"
              >
                <Icon name="upload" size={20} />
                <span className="text-[13px] font-medium">{uploading > 0 ? `Uploading ${uploading}…` : 'Add files'}</span>
                <span className="text-[11px]">drop here or click to browse</span>
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
        onChange={e => { if (e.target.files?.length) uploadFiles(e.target.files); e.target.value = '' }}
      />
    </div>
  )
}
