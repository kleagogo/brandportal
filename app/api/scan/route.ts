import { NextRequest, NextResponse } from 'next/server'
import { buildConfigFromScan, type ScanResult } from '@/lib/brand-builder'
import { savePreview } from '@/lib/store'
import { allow, clientIp } from '@/lib/ratelimit'
import { scanWebsite, type ScannedBrand } from '@/lib/scanner'

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  // Scans are the only per-use cost exposed to anonymous visitors — cap them.
  if (!allow(`scan:${clientIp(req)}`, 10, 60 * 60_000)) {
    return NextResponse.json({ error: 'Scan limit reached — try again in an hour' }, { status: 429 })
  }

  let fullUrl: string
  let hostname: string
  try {
    fullUrl = url.startsWith('http') ? url : `https://${url}`
    hostname = new URL(fullUrl).hostname.replace('www.', '')
  } catch {
    return NextResponse.json({ error: 'That doesn’t look like a valid URL' }, { status: 400 })
  }

  let brand: ScanResult
  try {
    const scanned = await scanWebsite(fullUrl)
    brand = process.env.ANTHROPIC_API_KEY ? await enhanceWithClaude(scanned) : scanned
  } catch {
    brand = generateDemoResult(hostname, fullUrl)
  }

  // Build a complete hub config from the scan and store it as a preview.
  const config = buildConfigFromScan({ ...brand, originalUrl: fullUrl })
  const previewId = await savePreview(config)

  return NextResponse.json({ previewId, brandName: brand.brandName })
}

/**
 * Claude pass: picks the best palette from the extracted candidates, writes a
 * sharper tagline, and sanity-checks the brand name. Falls back silently.
 */
async function enhanceWithClaude(scanned: ScannedBrand): Promise<ScanResult> {
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create(
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `A website was scanned for its brand. Extracted signals:
- Site name: ${scanned.brandName}
- Description: ${scanned.tagline || '(none)'}
- Color candidates (strongest first): primary=${scanned.primaryColor}, accent=${scanned.accentColor || 'none'}, extras=${scanned.extraColors.join(', ') || 'none'}
- Fonts: body=${scanned.fontFamily}, heading=${scanned.headingFont || 'none'}
- URL: ${scanned.originalUrl}

Using your knowledge of this brand (if you recognize it) plus the signals, return ONLY JSON:
{"brandName":"official name","tagline":"their real tagline or a faithful short one","primaryColor":"#hex","accentColor":"#hex or null","extraColors":["#hex", "..."],"fontFamily":"body font name"}
Prefer the extracted candidates unless you're confident the brand's true color differs.`,
        }],
      },
      { timeout: 9000 }
    )
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(text.match(/\{[\s\S]+\}/)?.[0] || '{}')
    return {
      ...scanned,
      brandName: typeof parsed.brandName === 'string' && parsed.brandName ? parsed.brandName : scanned.brandName,
      tagline: typeof parsed.tagline === 'string' && parsed.tagline ? parsed.tagline : scanned.tagline,
      primaryColor: typeof parsed.primaryColor === 'string' ? parsed.primaryColor : scanned.primaryColor,
      accentColor: typeof parsed.accentColor === 'string' ? parsed.accentColor : scanned.accentColor,
      extraColors: Array.isArray(parsed.extraColors) ? parsed.extraColors.filter((c: unknown) => typeof c === 'string') : scanned.extraColors,
      fontFamily: typeof parsed.fontFamily === 'string' && parsed.fontFamily ? parsed.fontFamily : scanned.fontFamily,
    }
  } catch {
    return scanned
  }
}

// ---------- Demo fallback ----------
// Plausible brand data when the URL can't be fetched at all.
function generateDemoResult(hostname: string, url: string): ScanResult {
  const known: Record<string, Partial<ScanResult>> = {
    'stripe.com': { brandName: 'Stripe', primaryColor: '#635bff', accentColor: '#0a2540', fontFamily: 'Inter', tagline: 'Financial infrastructure for the internet.' },
    'linear.app': { brandName: 'Linear', primaryColor: '#5e6ad2', fontFamily: 'Inter', tagline: 'The issue tracker that makes it easier to ship.' },
    'notion.so': { brandName: 'Notion', primaryColor: '#000000', fontFamily: 'ui-sans-serif', tagline: 'One workspace. Every team.' },
    'figma.com': { brandName: 'Figma', primaryColor: '#f24e1e', accentColor: '#a259ff', extraColors: ['#1abcfe', '#0acf83'], fontFamily: 'Inter', tagline: 'The collaborative interface design tool.' },
    'vercel.com': { brandName: 'Vercel', primaryColor: '#000000', fontFamily: 'Geist', tagline: 'Build and deploy the best web experiences.' },
    'monzo.com': { brandName: 'Monzo', primaryColor: '#ff4e64', accentColor: '#0c2340', fontFamily: 'Inter', tagline: 'A bank that makes you feel in control.' },
    'mollie.com': { brandName: 'Mollie', primaryColor: '#0f0d31', accentColor: '#3c53ff', fontFamily: 'Circular', tagline: 'Effortless payments for every business.' },
    'loom.com': { brandName: 'Loom', primaryColor: '#625df5', fontFamily: 'Inter', tagline: 'Fewer meetings, more doing.' },
    'pitch.com': { brandName: 'Pitch', primaryColor: '#f7db49', accentColor: '#1a1a1a', fontFamily: 'Inter', tagline: 'Collaborative presentation software.' },
  }

  const base = hostname.split('.')[0]
  const fallbackColors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return {
    brandName: base.charAt(0).toUpperCase() + base.slice(1),
    tagline: `${base.charAt(0).toUpperCase() + base.slice(1)} brand assets and guidelines.`,
    primaryColor: fallbackColors[base.charCodeAt(0) % fallbackColors.length],
    backgroundColor: '#ffffff',
    fontFamily: 'Inter',
    extraColors: [],
    faviconUrl: `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`,
    originalUrl: url,
    ...(known[hostname] || {}),
  }
}
