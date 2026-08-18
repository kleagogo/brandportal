'use client'

import { useEffect, useRef, useState } from 'react'
import { useHub } from './HubContext'
import { Icon } from './Icon'
import { ImportReview } from './ImportReview'
import { useAssetImport } from './use-asset-import'
import { filesFromDrop, filesFromInput } from './pick-files'
import { humanSize, uploadConfig } from './upload-client'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from '@/components/ui/empty'
import { OrganicShimmer } from '../transitions'

/**
 * Adding files to the hub without first choosing where they go.
 *
 * The section-level drop zone answers "put these here". This answers the
 * question people actually arrive with, which is "here is the client folder,
 * sort it out" — so it plans across every section, and the review step that
 * follows is where a folder with no matching section becomes a new one.
 *
 * Loose files need somewhere to land, so the first assets section stands in.
 * `alwaysReview` keeps the plan on screen even when everything routed cleanly,
 * because from here nobody picked a destination by standing in it.
 */
export function ImportModal({ onClose }: { onClose: () => void }) {
  const { config } = useHub()
  const [dragOver, setDragOver] = useState(false)
  const [maxLabel, setMaxLabel] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const firstAssetsSection = config.sections.find(s => s.type === 'assets')?.id || 'logo'

  const {
    addFiles, confirmImport, cancelReview, review, progress, error, notice,
  } = useAssetImport({
    fallbackSectionId: firstAssetsSection,
    alwaysReview: true,
    onFinished: onClose,
  })

  useEffect(() => {
    const input = folderInputRef.current
    if (!input) return
    input.setAttribute('webkitdirectory', '')
    input.setAttribute('directory', '')
  }, [])

  useEffect(() => {
    uploadConfig().then(caps => setMaxLabel(humanSize(caps.maxBytes))).catch(() => {})
  }, [])

  // The review dialog replaces this one rather than stacking on it: two modals
  // deep is where people lose track of what they are agreeing to.
  if (review) {
    return (
      <ImportReview
        buckets={review.buckets}
        sections={config.sections}
        scanning={review.scanning}
        onConfirm={confirmImport}
        onCancel={() => { cancelReview(); onClose() }}
      />
    )
  }

  return (
    <Dialog open onOpenChange={open => { if (!open && !progress) onClose() }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add files</DialogTitle>
          <DialogDescription>
            Drop a whole client folder and Pitho sorts it into the right sections.
            You confirm the plan before anything lands.
          </DialogDescription>
        </DialogHeader>

        {progress ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <OrganicShimmer width={168} height={96} radius={12} playing />
            <p className="text-[14px] font-medium">
              {progress.total === 1
                ? `${progress.name} · ${Math.round(progress.percent)}%`
                : `Uploading ${progress.done} of ${progress.total}`}
            </p>
            <span className="w-56 h-1 rounded-full bg-border overflow-hidden">
              <span
                className="block h-full bg-foreground transition-all"
                style={{ width: `${progress.total === 1 ? progress.percent : (progress.done / progress.total) * 100}%` }}
              />
            </span>
          </div>
        ) : (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault()
              setDragOver(false)
              filesFromDrop(e.dataTransfer).then(addFiles)
            }}
          >
            <Empty className={`border-2 border-dashed transition-colors ${dragOver ? 'border-foreground bg-muted' : ''}`}>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Icon name="upload" size={16} />
                </EmptyMedia>
                <EmptyTitle className="text-[15px]">Drop files or folders</EmptyTitle>
                <EmptyDescription className="text-[13px]">
                  Single files, a .zip, or a whole folder. Anything that does not
                  match a section becomes a new one, with your say-so.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent className="flex-row flex-wrap justify-center">
                <Button variant="default" onClick={() => inputRef.current?.click()}>Choose files</Button>
                <Button variant="outline" onClick={() => folderInputRef.current?.click()}>Pick a whole folder</Button>
              </EmptyContent>
            </Empty>
          </div>
        )}

        {error && <p className="text-[13px] text-destructive">{error}</p>}
        {notice && <p className="text-[13px] text-muted-foreground">{notice}</p>}
        {!progress && (
          <p className="text-[11.5px] text-muted-foreground/60 text-center">
            Logos, source files, fonts, video and archives{maxLabel ? ` · up to ${maxLabel} per file` : ''}
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => { if (e.target.files) addFiles(filesFromInput(e.target.files)); e.target.value = '' }}
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => { if (e.target.files) addFiles(filesFromInput(e.target.files)); e.target.value = '' }}
        />
      </DialogContent>
    </Dialog>
  )
}
