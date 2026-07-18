'use client'

import { useRef, useState } from 'react'
import { useHub } from './HubContext'
import { Editable } from './Editable'
import { Icon } from './Icon'
import type { AssetFile } from '@/app/types/brand'

function isImage(file: string): boolean {
  return /\.(svg|png|jpg|jpeg|webp|gif|ico)(\?|$)/i.test(file)
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
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Upload failed')
        const asset: AssetFile = {
          name: file.name.replace(/\.[^.]*$/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()),
          file: data.url,
          format: [data.format],
          usage: '',
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

  return (
    <div>
      <h1 className="text-[22px] font-bold tracking-tight mb-1">{label}</h1>
      <p className="text-[14px] text-[#8a8a85] mb-8">
        {editing
          ? 'Drop files anywhere below to add them, and click names or notes to edit.'
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
        className={`rounded-2xl transition-colors ${dragOver ? 'bg-[#f0efec] outline-2 outline-dashed outline-[#1a1a1a]' : ''}`}
      >
        {assets.length === 0 && !editing ? (
          <div className="border-2 border-dashed border-[#e8e7e4] rounded-2xl p-12 text-center">
            <p className="text-[14px] font-medium text-[#8a8a85] mb-1">No assets here yet</p>
            <p className="text-[12px] text-[#b0afa9]">Check back soon — this section is being filled.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset, i) => (
              <div key={`${asset.file}-${i}`} className="bg-white border border-[#e8e7e4] rounded-xl overflow-hidden group relative">
                {editing && (
                  <button
                    onClick={() => update(c => { c.assets[sectionId].splice(i, 1) })}
                    className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-white border border-[#e8e7e4] text-[#8a8a85] hover:text-red-500 hover:border-red-300 items-center justify-center hidden group-hover:flex transition-colors"
                    title="Remove asset"
                  >
                    <Icon name="close" size={11} />
                  </button>
                )}
                <div className="h-36 flex items-center justify-center bg-[#f9f9f8] border-b border-[#e8e7e4] p-6">
                  {isImage(asset.file) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.file}
                      alt={asset.name}
                      className="max-h-full max-w-full object-contain"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-[#e8e7e4] rounded-lg flex items-center justify-center text-[#8a8a85]">
                      <Icon name="file" size={20} />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[13px] font-medium text-[#1a1a1a] mb-1">
                    <Editable value={asset.name} placeholder="Asset name" onChange={v => update(c => { c.assets[sectionId][i].name = v })} />
                  </p>
                  <p className="text-[11px] text-[#8a8a85] mb-2 leading-tight">
                    <Editable value={asset.usage || ''} placeholder="Add a usage note" onChange={v => update(c => { c.assets[sectionId][i].usage = v })} />
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {asset.format.map(f => (
                        <span key={f} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#f0efec] text-[#8a8a85]">{f}</span>
                      ))}
                    </div>
                    <a
                      href={downloadHref(asset.file)}
                      download
                      className="w-7 h-7 rounded-lg border border-[#e8e7e4] flex items-center justify-center hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a] transition-colors text-[#8a8a85]"
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
                className="min-h-[220px] border-2 border-dashed border-[#dddcd6] rounded-xl text-[#b0afa9] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors flex flex-col items-center justify-center gap-2 p-6"
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
