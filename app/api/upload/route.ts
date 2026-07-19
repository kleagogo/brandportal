import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { canEditHub, getHub, getMeta } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads')
const MAX_SIZE = 15 * 1024 * 1024 // 15MB
const ALLOWED = new Set(['svg', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'ico', 'pdf', 'zip', 'eps', 'ai', 'mp4', 'woff', 'woff2', 'otf', 'ttf'])

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file')
  const slug = String(form.get('slug') || '')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Uploads always belong to a real hub — only its editors may add files.
  // (getMeta defaults unknown slugs to an open demo, so check existence first.)
  const hub = await getHub(slug)
  const meta = await getMeta(slug)
  const user = await getSessionUser()
  if (!hub || !canEditHub(meta, user)) {
    return NextResponse.json({ error: 'You don’t have permission to upload to this hub' }, { status: 403 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File is too large (max 15MB)' }, { status: 413 })
  }

  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (!ALLOWED.has(ext)) {
    return NextResponse.json({ error: `File type .${ext || '?'} is not supported` }, { status: 415 })
  }

  const base = (file.name.replace(/\.[^.]*$/, '') || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'file'
  const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  const filename = `${base}-${unique}.${ext}`

  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer)

  // AI assist: for images, let Claude suggest a name, tags, and usage note.
  const suggestion = await describeImage(buffer, ext, file.name)

  return NextResponse.json({
    url: `/api/files/${filename}`,
    originalName: file.name,
    format: ext.toUpperCase(),
    size: file.size,
    ...(suggestion ? { suggestion } : {}),
  })
}

const VISION_TYPES: Record<string, 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif',
}

/** Ask Claude to describe an uploaded image. Best-effort: any failure → null. */
async function describeImage(
  buffer: Buffer,
  ext: string,
  originalName: string
): Promise<{ name: string; tags: string[]; usage: string } | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  const mediaType = VISION_TYPES[ext]
  if (!mediaType || buffer.length > 4 * 1024 * 1024) return null

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create(
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: buffer.toString('base64') } },
            { type: 'text', text: `This file ("${originalName}") was uploaded to a brand asset hub. Return ONLY JSON: {"name":"short human title","tags":["3-5 lowercase tags"],"usage":"one short sentence on when to use this asset"}` },
          ],
        }],
      },
      { timeout: 8000 }
    )
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const parsed = JSON.parse(text.match(/\{[\s\S]+\}/)?.[0] || '')
    if (typeof parsed.name !== 'string' || !Array.isArray(parsed.tags)) return null
    return {
      name: parsed.name.slice(0, 60),
      tags: parsed.tags.filter((t: unknown) => typeof t === 'string').slice(0, 5),
      usage: typeof parsed.usage === 'string' ? parsed.usage.slice(0, 120) : '',
    }
  } catch {
    return null
  }
}
