'use client'

import { unzip } from 'fflate'

/**
 * Turning what someone dropped into a flat list of files worth uploading.
 *
 * Agencies don't add a brand one logo at a time — they drag the client folder
 * in, or the zip the client emailed. Both arrive as something other than a
 * plain file list: folders only come through the entry API, and a zip is one
 * opaque file until it's opened. This module handles both, and remembers the
 * folder each file came from so the structure survives the trip.
 */

/** A file the user picked, with the folder path it arrived under. */
export interface PickedFile {
  file: File
  /** Folder path relative to what was picked; '' at the top level. */
  path: string
}

/** Files no one means to upload — OS bookkeeping that rides along in zips. */
function isJunk(path: string): boolean {
  return path.split('/').some(part => part.startsWith('.') || part === '__MACOSX')
}

function extensionOf(name: string): string {
  return (name.split('.').pop() || '').toLowerCase()
}

/**
 * Walk a dropped entry, collecting every file beneath it.
 *
 * `prefix` is the folder path the entry sits in, so files carry where they
 * came from rather than arriving as an anonymous heap.
 */
async function walkEntry(entry: FileSystemEntry, prefix: string, out: PickedFile[]): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File | null>(resolve =>
      (entry as FileSystemFileEntry).file(f => resolve(f), () => resolve(null))
    )
    if (file) out.push({ file, path: prefix })
    return
  }

  const reader = (entry as FileSystemDirectoryEntry).createReader()
  const inner = prefix ? `${prefix}/${entry.name}` : entry.name
  // readEntries returns one batch at a time and signals the end with an empty
  // array — a single call would quietly miss everything past the first ~100.
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>(resolve =>
      reader.readEntries(entries => resolve(entries), () => resolve([]))
    )
    if (!batch.length) break
    for (const child of batch) await walkEntry(child, inner, out)
  }
}

/**
 * Everything in a drop, including the contents of dropped folders.
 *
 * `dataTransfer.files` is empty for a folder, which is why dragging one in
 * used to do nothing at all. The entry API is what sees inside.
 */
export async function filesFromDrop(dt: DataTransfer): Promise<PickedFile[]> {
  const entries = Array.from(dt.items)
    .filter(item => item.kind === 'file')
    .map(item => (item.webkitGetAsEntry ? item.webkitGetAsEntry() : null))
    .filter((entry): entry is FileSystemEntry => entry !== null)

  // No entry API (or a drop that carries none) — fall back to the flat list.
  if (!entries.length) return Array.from(dt.files).map(file => ({ file, path: '' }))

  const out: PickedFile[] = []
  for (const entry of entries) await walkEntry(entry, '', out)
  return out
}

/** Files chosen through an <input>, in either file or folder mode. */
export function filesFromInput(files: FileList): PickedFile[] {
  return Array.from(files).map(file => ({
    file,
    // Only set when the picker was opened with webkitdirectory.
    path: file.webkitRelativePath
      ? file.webkitRelativePath.split('/').slice(0, -1).join('/')
      : '',
  }))
}

function unzipAsync(data: Uint8Array): Promise<Record<string, Uint8Array>> {
  return new Promise((resolve, reject) =>
    unzip(data, (err, files) => (err ? reject(err) : resolve(files)))
  )
}

/**
 * Replace any zip in the selection with the files inside it.
 *
 * Unpacking in the browser rather than on the server means a 400MB archive
 * never has to survive one request — each file inside travels on its own, so
 * the upload limit applies per asset instead of to the whole delivery.
 */
export async function expandArchives(picked: PickedFile[]): Promise<PickedFile[]> {
  const out: PickedFile[] = []

  for (const item of picked) {
    if (extensionOf(item.file.name) !== 'zip') {
      out.push(item)
      continue
    }

    let entries: Record<string, Uint8Array>
    try {
      entries = await unzipAsync(new Uint8Array(await item.file.arrayBuffer()))
    } catch {
      out.push(item) // unreadable as an archive — keep it as a plain file
      continue
    }

    // The archive's own name becomes a folder, so two zips don't merge.
    const base = item.file.name.replace(/\.zip$/i, '')
    const root = item.path ? `${item.path}/${base}` : base

    for (const [name, bytes] of Object.entries(entries)) {
      if (name.endsWith('/') || isJunk(name)) continue
      const parts = name.split('/')
      const filename = parts.pop()
      if (!filename) continue
      out.push({
        file: new File([bytes as BlobPart], filename),
        path: [root, parts.join('/')].filter(Boolean).join('/'),
      })
    }
  }

  return out
}

/**
 * Drop the folder every file shares.
 *
 * Dragging in "Acme Brand" should group assets by "Logos/Primary", not by
 * "Acme Brand/Logos/Primary" — the outer folder is the hub itself.
 */
export function stripCommonRoot(picked: PickedFile[]): PickedFile[] {
  if (!picked.length) return picked

  const split = picked.map(item => (item.path ? item.path.split('/') : []))
  if (split.some(parts => !parts.length)) return picked // something's already at the root

  let shared = split[0].length
  for (const parts of split) {
    let i = 0
    while (i < shared && i < parts.length && parts[i] === split[0][i]) i++
    shared = i
  }
  if (!shared) return picked

  return picked.map((item, n) => ({ ...item, path: split[n].slice(shared).join('/') }))
}

/**
 * Split a selection into what this deployment accepts and what it doesn't, so
 * a folder with a stray .exe reports one skipped file instead of failing.
 */
export function splitByAllowed(
  picked: PickedFile[],
  allowed: string[]
): { usable: PickedFile[]; skipped: number } {
  const types = new Set(allowed)
  const usable = picked.filter(item => types.has(extensionOf(item.file.name)))
  return { usable, skipped: picked.length - usable.length }
}
