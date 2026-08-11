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
      .catch(() => ({ blob: false, directLimit: 4 * 1024 * 1024, maxBytes: 4 * 1024 * 1024, allowed: [] }))
  }
  return cached
}

export function humanSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / 1024 / 1024)}MB`
  return `${Math.max(1, Math.round(bytes / 1024))}KB`
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
        : `${file.name} is ${humanSize(file.size)} — files over ${humanSize(config.directLimit)} need blob storage connected`
    )
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
    // The file never touched the server, so ask for suggestions separately.
    let suggestion: UploadResult['suggestion']
    try {
      const res = await fetch('/api/upload/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: blob.url, name: file.name, slug }),
      })
      if (res.ok) suggestion = (await res.json()).suggestion || undefined
    } catch { /* suggestions are a bonus, never a blocker */ }

    return { url: blob.url, format: ext.toUpperCase(), size: file.size, ...(suggestion ? { suggestion } : {}) }
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
