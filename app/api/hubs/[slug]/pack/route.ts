import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import AdmZip from 'adm-zip'
import { canViewHub, getHub, getMeta } from '@/lib/store'
import { getStorage } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { assetKey } from '@/lib/uploads'

const PUBLIC_DIR = path.join(process.cwd(), 'public')

/** Biggest remote file worth pulling into a zip on the fly. */
const REMOTE_LIMIT = 100 * 1024 * 1024

/**
 * Read a file shipped in /public.
 *
 * On a Node host that's a disk read; on Cloudflare Workers there is no
 * filesystem, so the same file is fetched back from the app's own origin,
 * where it's served as a static asset.
 */
async function readPublic(file: string, origin: string): Promise<Buffer | null> {
  const rel = path.normalize(file).replace(/^([/\\])+/, '')
  try {
    return await fs.readFile(path.join(PUBLIC_DIR, rel))
  } catch { /* no filesystem here — try the CDN copy */ }
  try {
    const res = await fetch(new URL(`/${rel}`, origin))
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

/** Fetch a blob-stored asset so it can be zipped. Any failure → link instead. */
async function fetchRemote(url: string): Promise<Buffer | null> {
  try {
    if (!/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(url)) return null
    const res = await fetch(url)
    if (!res.ok) return null
    const length = Number(res.headers.get('content-length') || 0)
    if (length > REMOTE_LIMIT) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    return buffer.length > REMOTE_LIMIT ? null : buffer
  } catch {
    return null
  }
}

/**
 * Download a section's assets as one zip — the "logo pack" button.
 * Includes locally-stored files (uploads and /public assets); external URLs
 * (e.g. a favicon pulled from the scanned site) are listed in a readme.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const hub = await getHub(slug)
  if (!hub) return NextResponse.json({ error: 'Hub not found' }, { status: 404 })

  // This returns the actual files, so it needs the same permission as the hub
  // itself — a zip is not a lesser thing to hand out than the page.
  const meta = await getMeta(slug)
  if (!(await canViewHub(slug, meta, await getSessionUser()))) {
    return NextResponse.json({ error: 'This hub is locked' }, { status: 401 })
  }

  const sectionId = req.nextUrl.searchParams.get('section') || 'logo'
  const assets = hub.assets[sectionId] || []
  if (assets.length === 0) {
    return NextResponse.json({ error: 'No assets in this section yet' }, { status: 404 })
  }

  const zip = new AdmZip()
  const external: string[] = []

  for (const asset of assets) {
    const safeName = asset.name.replace(/[^\w\- ]+/g, '').trim() || 'asset'
    const key = assetKey(asset.file)
    if (key) {
      // Ours, wherever it lives — read it from the driver, not over the wire.
      const data = await getStorage().getFile(path.basename(key))
      if (data) zip.addFile(`${safeName}${path.extname(key)}`, data)
      else external.push(`${asset.name}: file missing`)
    } else if (asset.file.startsWith('/')) {
      const data = await readPublic(asset.file, req.nextUrl.origin)
      if (data) zip.addFile(`${safeName}${path.extname(asset.file)}`, data)
      else external.push(`${asset.name}: file missing`)
    } else if (asset.file.startsWith('https://')) {
      // Files kept in blob storage still belong in the zip.
      const data = await fetchRemote(asset.file)
      if (data) zip.addFile(`${safeName}${path.extname(new URL(asset.file).pathname)}`, data)
      else external.push(`${asset.name}: ${asset.file}`)
    } else {
      external.push(`${asset.name}: ${asset.file}`)
    }
  }

  if (external.length > 0) {
    zip.addFile('external-links.txt', Buffer.from(
      `These assets are external links, not files:\n\n${external.join('\n')}\n`, 'utf8'
    ))
  }

  const label = hub.sections.find(s => s.id === sectionId)?.label || sectionId
  // Header values must be latin1 — keep the filename plain ASCII.
  const ascii = (v: string) => v.normalize('NFKD').replace(/[^\x20-\x7E]+/g, '').replace(/["\\]/g, '').trim()
  const filename = `${ascii(hub.name) || 'brand'} - ${ascii(label) || 'assets'}.zip`

  return new NextResponse(new Uint8Array(zip.toBuffer()), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
