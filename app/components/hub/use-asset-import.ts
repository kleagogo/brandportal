'use client'

import { useRef, useState } from 'react'
import { useHub } from './HubContext'
import { humanSize, localPreview, uploadAsset, uploadConfig } from './upload-client'
import {
  expandArchives, splitByAllowed, stripCommonRoot, type PickedFile,
} from './pick-files'
import { applyAnswers, planImport, unplaced, type ImportBucket } from './route-files'
import { addFontFile, isFontFile } from './font-files'
import type { ImportDecision } from './ImportReview'
import type { AssetFile, SectionConfig } from '@/app/types/brand'

/** How many files to upload at once. Enough to keep the pipe busy, not so
 *  many that a folder of 300 logos opens 300 sockets. */
const CONCURRENCY = 4

export interface ImportProgress {
  done: number
  total: number
  name: string
  percent: number
}

/**
 * Taking a pile of files and putting each one where it belongs.
 *
 * This used to live inside AssetsSection, which meant importing was something
 * you could only do from inside a section — backwards for the common case,
 * which is dropping a whole client folder into a hub that is still empty.
 * Lifting it here lets the hub header offer the same thing without a section
 * in mind.
 *
 * `fallbackSectionId` is where loose files land: the files someone picked
 * without a folder around them. From inside a section that is the section they
 * are looking at. From the hub header there is no such section, so the caller
 * names one and `alwaysReview` keeps the confirmation step on, because nobody
 * chose a destination by standing somewhere.
 */
export function useAssetImport({
  fallbackSectionId,
  alwaysReview = false,
  onFinished,
}: {
  fallbackSectionId: string
  alwaysReview?: boolean
  onFinished?: () => void
}) {
  const { config, editing, update, sandbox } = useHub()
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  // The sorted plan, waiting for approval. Null when nothing is being reviewed.
  const [review, setReview] = useState<{ buckets: ImportBucket[]; scanning: boolean } | null>(null)
  // Unsupported files are counted while preparing but only reported once the
  // upload actually runs, which can be a dialog away.
  const skippedRef = useRef(0)

  /**
   * Take everything the user picked — files, folders, archives — and add it.
   *
   * Archives are opened and folders flattened first, so what gets uploaded is
   * always plain files. A drop that carries folders is then sorted into the
   * hub's sections rather than piled into one, and shown for approval before
   * anything lands.
   */
  async function addFiles(picked: PickedFile[]) {
    setError('')
    setNotice('')
    if (!picked.length) return

    const caps = await uploadConfig()
    const prepared = stripCommonRoot(await expandArchives(picked))
    const { usable, skipped } = splitByAllowed(prepared, caps.allowed)
    skippedRef.current = skipped

    if (!usable.length) {
      setError(skipped
        ? `None of those ${skipped} file${skipped > 1 ? 's are' : ' is'} a supported type`
        : 'Nothing to upload')
      return
    }

    const buckets = planImport(usable, config.sections, fallbackSectionId)

    // A plain drop of loose files goes where the person is standing — they
    // picked the section by being on it, and a dialog would only be in the way.
    // From the hub header nobody is standing anywhere, so the plan is shown.
    const trivial = !alwaysReview && buckets.length === 1 && buckets[0].sectionId === fallbackSectionId
    if (trivial) {
      await runUpload(usable.map(item => ({ item, sectionId: fallbackSectionId })), skipped)
      return
    }

    setReview({ buckets, scanning: unplaced(buckets).length > 0 })

    // Ask about the folders the rules couldn't place. The dialog is already up
    // with the rules' own answer, so a slow or absent AI just means it doesn't
    // change — never a blocked upload.
    const asking = unplaced(buckets)
    if (!asking.length || sandbox) {
      if (sandbox) setReview(current => current && { ...current, scanning: false })
      return
    }
    try {
      const res = await fetch('/api/upload/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: config.slug,
          folders: asking.map(b => ({
            key: b.key,
            name: b.folder,
            files: b.items.slice(0, 6).map(i => i.file.name),
          })),
        }),
      })
      const data = await res.json().catch(() => ({ answers: [] }))
      setReview(current => current && ({
        buckets: applyAnswers(current.buckets, data.answers || [], config.sections),
        scanning: false,
      }))
    } catch {
      setReview(current => current && { ...current, scanning: false })
    }
  }

  /** Turn the reviewed plan into real sections and real uploads. */
  async function confirmImport(decisions: ImportDecision[]) {
    setReview(null)

    // New sections are created first and all at once, so their ids exist
    // before any file needs one to land in.
    const taken = new Set(config.sections.map(s => s.id))
    const created: Array<{ id: string; label: string; icon: SectionConfig['icon'] }> = []
    const targets: Array<{ item: PickedFile; sectionId: string }> = []

    for (const { bucket, destination } of decisions) {
      if (destination.kind === 'skip') continue
      let target: string
      if (destination.kind === 'section') {
        target = destination.sectionId
      } else {
        const base = destination.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section'
        let id = base
        for (let n = 2; taken.has(id); n++) id = `${base}-${n}`
        taken.add(id)
        created.push({ id, label: destination.label, icon: bucket.icon })
        target = id
      }
      for (const item of bucket.items) targets.push({ item, sectionId: target })
    }

    if (created.length) {
      update(c => {
        for (const section of created) {
          c.sections.push({ id: section.id, label: section.label, type: 'assets', icon: section.icon, group: 'assets' })
          c.assets[section.id] = []
        }
      })
    }

    if (!targets.length) {
      setNotice('Nothing added')
      onFinished?.()
      return
    }
    await runUpload(targets, skippedRef.current, created.length)
  }

  /** Upload each file into the section the plan gave it. */
  async function runUpload(
    targets: Array<{ item: PickedFile; sectionId: string }>,
    skipped: number,
    newSections = 0
  ) {
    const total = targets.length
    const queue = [...targets]
    const failed: string[] = []
    const touched = new Set<string>()
    let done = 0
    setProgress({ done: 0, total, name: targets[0].item.file.name, percent: 0 })

    async function worker() {
      for (;;) {
        const next = queue.shift()
        if (!next) return
        const { item, sectionId: target } = next
        try {
          // Per-file percentages only mean something when there's one file;
          // in a batch the count is the useful signal.
          const data = sandbox
            ? localPreview(item.file)
            : await uploadAsset(
                item.file,
                config.slug,
                total === 1 ? percent => setProgress({ done, total, name: item.file.name, percent }) : undefined
              )
          // A font going to a typography section becomes a typeface, not a
          // tile in the file store — which is where fonts used to land, on a
          // page that never reads it. Onest-SemiBold.woff2 becomes (or joins)
          // "Onest", and the @font-face in Hub makes it render.
          const targetSection = config.sections.find(sec => sec.id === target)
          if (targetSection?.type === 'typography' && isFontFile(item.file.name)) {
            touched.add(target)
            update(c => { addFontFile(c, item.file.name, data.url) })
            continue
          }
          const asset: AssetFile = {
            name: data.suggestion?.name || item.file.name.replace(/\.[^.]*$/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()),
            file: data.url,
            format: [data.format],
            bytes: data.bytes ?? item.file.size,
            usage: data.suggestion?.usage || '',
            tags: data.suggestion?.tags || [],
            ...(item.path ? { subgroup: item.path } : {}),
          }
          touched.add(target)
          update(c => {
            if (!c.assets[target]) c.assets[target] = []
            c.assets[target].push(asset)
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
    if (touched.size > 1) parts.push(`across ${touched.size} sections`)
    if (newSections) parts.push(`${newSections} new section${newSections > 1 ? 's' : ''}`)
    if (failed.length) parts.push(`${failed.length} failed`)
    if (skipped) parts.push(`${skipped} skipped as unsupported`)
    if (added && !editing) parts.push('hit Edit to rename or tag them')
    if (parts.length > 1 || skipped) setNotice(parts.join(' · '))
    onFinished?.()
  }

  return {
    addFiles,
    confirmImport,
    cancelReview: () => setReview(null),
    review,
    progress,
    error,
    notice,
    setError,
    setNotice,
  }
}

export { humanSize, uploadConfig }
