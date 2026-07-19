import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import AdmZip from 'adm-zip'
import { getHub } from '@/lib/store'

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads')
const PUBLIC_DIR = path.join(process.cwd(), 'public')

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

  const sectionId = req.nextUrl.searchParams.get('section') || 'logo'
  const assets = hub.assets[sectionId] || []
  if (assets.length === 0) {
    return NextResponse.json({ error: 'No assets in this section yet' }, { status: 404 })
  }

  const zip = new AdmZip()
  const external: string[] = []

  for (const asset of assets) {
    const safeName = asset.name.replace(/[^\w\- ]+/g, '').trim() || 'asset'
    if (asset.file.startsWith('/api/files/')) {
      const filename = path.basename(asset.file.split('?')[0])
      try {
        const data = await fs.readFile(path.join(UPLOAD_DIR, filename))
        zip.addFile(`${safeName}${path.extname(filename)}`, data)
      } catch { external.push(`${asset.name}: file missing`) }
    } else if (asset.file.startsWith('/')) {
      try {
        const rel = path.normalize(asset.file).replace(/^([/\\])+/, '')
        const data = await fs.readFile(path.join(PUBLIC_DIR, rel))
        zip.addFile(`${safeName}${path.extname(asset.file)}`, data)
      } catch { external.push(`${asset.name}: file missing`) }
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
