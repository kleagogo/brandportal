import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads')
const MAX_SIZE = 15 * 1024 * 1024 // 15MB
const ALLOWED = new Set(['svg', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'ico', 'pdf', 'zip', 'eps', 'ai', 'mp4', 'woff', 'woff2', 'otf', 'ttf'])

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
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
  await fs.writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()))

  return NextResponse.json({
    url: `/api/files/${filename}`,
    originalName: file.name,
    format: ext.toUpperCase(),
    size: file.size,
  })
}
