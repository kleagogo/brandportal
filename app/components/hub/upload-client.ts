'use client'

import { upload } from '@vercel/blob/client'

/**
 * One uploader for the whole app.
 *
 * Small files POST to /api/upload as before. Once blob storage is configured,
 * anything bigger goes straight from the browser to storage, so a 300MB video
 * or a packaged .indd never has to fit inside a serverless request body.
 */

export interface UploadResult {
  url: string
  format: string
  size: number
  suggestion?: { name: string; tags: string[]; usage: string }
}

interface UploadConfig {
  /** Cloudflare R2 — presigned PUT straight from the browser. */
  r2: boolean
  /** Vercel Blob — the same idea, different provider. */
  blob: boolean
  directLimit: number
  maxBytes: number
  allowed: string[]
}

let cached: Promise<UploadConfig> | null = null

export function uploadConfig(): Promise<UploadConfig> {
  if (!cached) {
    cached = fetch('/api/upload/config')
      .then(r => r.json())
      .catch(() => ({ r2: false, blob: false, directLimit: 4 * 1024 * 1024, maxBytes: 4 * 1024 * 1024, allowed: [] }))
  }
  return cached
}

export function humanSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / 1024 / 1024)}MB`
  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}

/** PUT a file to a presigned URL, reporting progress as it goes. */
function putWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.upload.onprogress = event => {
      if (event.lengthComputable) onProgress?.((event.loaded / event.total) * 100)
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300
      ? resolve()
      : reject(new Error(`Upload failed (${xhr.status})`)))
    xhr.onerror = () => reject(new Error(`Couldn’t upload ${file.name}`))
    xhr.send(file)
  })
}

/** Ask for a name/tags suggestion for a file that bypassed the server. */
async function describeStored(body: { key?: string; url?: string; name: string; slug: string }) {
  try {
    const res = await fetch('/api/upload/describe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) return {}
    const suggestion = (await res.json()).suggestion
    return suggestion ? { suggestion } : {}
  } catch {
    return {} // suggestions are a bonus, never a blocker
  }
}

/**
 * The demo's stand-in for uploading: the file is shown straight from the
 * browser and never sent anywhere.
 *
 * The tile looks exactly like a real one, so a visitor can see how uploading
 * behaves; the URL lives only as long as the tab, which is the whole point —
 * nothing is stored, so nobody inherits the last visitor's files.
 */
export function localPreview(file: File): UploadResult {
  return {
    url: URL.createObjectURL(file),
    format: (file.name.split('.').pop() || 'file').toUpperCase(),
    size: file.size,
  }
}

export async function uploadAsset(
  file: File,
  slug: string,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const config = await uploadConfig()
  const ext = (file.name.split('.').pop() || '').toLowerCase()

  if (file.size > config.maxBytes) {
    throw new Error(
      config.blob
        ? `${file.name} is too large (max ${humanSize(config.maxBytes)})`
        : `${file.name} is ${humanSize(file.size)}. Files over ${humanSize(config.directLimit)} need blob storage connected.`
    )
  }

  if (config.r2 && file.size > config.directLimit) {
    const res = await fetch('/api/upload/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, slug, size: file.size }),
    })
    const signed = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(signed.error || `Couldn’t upload ${file.name}`)

    await putWithProgress(signed.uploadUrl, file, signed.contentType, onProgress)

    return {
      url: signed.url,
      format: signed.format,
      size: file.size,
      ...(await describeStored({ key: signed.key, name: file.name, slug })),
    }
  }

  if (config.blob && file.size > config.directLimit) {
    onProgress?.(0)
    const blob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/upload/blob',
      clientPayload: slug,
      multipart: true,
      onUploadProgress: event => onProgress?.(event.percentage),
    })
    onProgress?.(100)
    return {
      url: blob.url,
      format: ext.toUpperCase(),
      size: file.size,
      ...(await describeStored({ url: blob.url, name: file.name, slug })),
    }
  }

  const form = new FormData()
  form.append('file', file)
  form.append('slug', slug)
  const res = await fetch('/api/upload', { method: 'POST', body: form })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Couldn’t upload ${file.name}`)
  onProgress?.(100)
  return data as UploadResult
}
