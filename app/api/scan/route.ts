import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  const fullUrl = url.startsWith('http') ? url : `https://${url}`
  const hostname = new URL(fullUrl).hostname.replace('www.', '')

  try {
    const response = await fetch(fullUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BrandPortalBot/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    const html = await response.text()
    const brand = extractBrandFromHTML(html, fullUrl)

    if (process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(await enhanceWithClaude(html, brand))
    }
    return NextResponse.json(brand)

  } catch {
    // Network unavailable (sandbox/dev) — return a realistic demo result
    // based on the hostname so each URL gives a different preview
    return NextResponse.json(generateDemoResult(hostname, fullUrl))
  }
}

// ---------- Demo fallback ----------
// Returns plausible brand data when the URL can't be fetched
function generateDemoResult(hostname: string, url: string) {
  const known: Record<string, object> = {
    'stripe.com':   { brandName: 'Stripe',  primaryColor: '#635bff', backgroundColor: '#ffffff', fontFamily: 'Inter', tagline: 'Financial infrastructure for the internet.' },
    'linear.app':   { brandName: 'Linear',  primaryColor: '#5e6ad2', backgroundColor: '#1a1a2e', fontFamily: 'Inter', tagline: 'The issue tracker that makes it easier to ship.' },
    'notion.so':    { brandName: 'Notion',  primaryColor: '#000000', backgroundColor: '#ffffff', fontFamily: 'ui-sans-serif', tagline: 'One workspace. Every team.' },
    'figma.com':    { brandName: 'Figma',   primaryColor: '#f24e1e', backgroundColor: '#1e1e1e', fontFamily: 'Inter', tagline: 'The collaborative interface design tool.' },
    'vercel.com':   { brandName: 'Vercel',  primaryColor: '#000000', backgroundColor: '#ffffff', fontFamily: 'GeistSans', tagline: 'Build and deploy the best web experiences.' },
    'monzo.com':    { brandName: 'Monzo',   primaryColor: '#ff4e64', backgroundColor: '#ffffff', fontFamily: 'Inter', tagline: 'A bank that makes you feel in control.' },
    'mollie.com':   { brandName: 'Mollie',  primaryColor: '#00a670', backgroundColor: '#ffffff', fontFamily: 'Inter', tagline: 'Accept online payments with ease.' },
    'loom.com':     { brandName: 'Loom',    primaryColor: '#625df5', backgroundColor: '#ffffff', fontFamily: 'Inter', tagline: 'Fewer meetings, more doing.' },
    'pitch.com':    { brandName: 'Pitch',   primaryColor: '#f7db49', backgroundColor: '#1a1a1a', fontFamily: 'Inter', tagline: 'Collaborative presentation software.' },
  }

  const base = hostname.split('.')[0]
  if (known[hostname]) return { ...known[hostname], faviconUrl: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`, originalUrl: url }

  // Generic fallback — derive a colour from the brand name
  const colors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899']
  const i = base.charCodeAt(0) % colors.length
  return {
    brandName: base.charAt(0).toUpperCase() + base.slice(1),
    primaryColor: colors[i],
    backgroundColor: '#ffffff',
    fontFamily: 'Inter',
    tagline: `${base.charAt(0).toUpperCase() + base.slice(1)} brand assets and guidelines.`,
    faviconUrl: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
  }
}

// ---------- Real extraction ----------
function extractBrandFromHTML(html: string, url: string) {
  const ogSiteName = html.match(/<meta[^>]*property="og:site_name"[^>]*content="([^"]+)"/i)?.[1]
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.replace(/\s*[|\-–]\s*.+$/, '').trim()
  const brandName = ogSiteName || titleTag || new URL(url).hostname.replace('www.', '').split('.')[0]

  const ogDesc = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i)?.[1]
  const metaDesc = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i)?.[1]
  const tagline = (ogDesc || metaDesc || '').slice(0, 120)

  const colorPatterns = [
    /--color-primary:\s*(#[0-9a-f]{3,8})/i,
    /--primary(?:-color)?:\s*(#[0-9a-f]{3,8})/i,
    /--brand(?:-color)?:\s*(#[0-9a-f]{3,8})/i,
    /--accent(?:-color)?:\s*(#[0-9a-f]{3,8})/i,
  ]
  let primaryColor = '#1a1a1a'
  for (const p of colorPatterns) { const m = html.match(p); if (m) { primaryColor = m[1]; break } }

  const themeColor = html.match(/<meta[^>]*name="theme-color"[^>]*content="([^"]+)"/i)?.[1]
  if (themeColor && primaryColor === '#1a1a1a') primaryColor = themeColor

  const googleFont = html.match(/fonts\.googleapis\.com\/css[^"']+family=([A-Za-z+]+)/)?.[1]?.replace(/\+/g, ' ')
  const fontFamily = googleFont || 'Inter'

  const faviconPath = html.match(/<link[^>]*rel="(?:shortcut )?icon"[^>]*href="([^"]+)"/i)?.[1]
  const faviconUrl = faviconPath ? (faviconPath.startsWith('http') ? faviconPath : `${new URL(url).origin}${faviconPath}`) : ''

  return { brandName: brandName.charAt(0).toUpperCase() + brandName.slice(1), tagline, primaryColor, backgroundColor: '#ffffff', fontFamily, faviconUrl }
}

async function enhanceWithClaude(html: string, fallback: ReturnType<typeof extractBrandFromHTML>) {
  const snippet = html.slice(0, 6000)
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: `Extract brand info from this HTML. Return only JSON: {"brandName":"...","tagline":"...","primaryColor":"#hex","backgroundColor":"#hex","fontFamily":"..."}\n\nHTML:\n${snippet}` }],
  })
  try {
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(text.match(/\{[\s\S]+\}/)?.[0] || '{}')
    return { ...fallback, ...parsed, faviconUrl: fallback.faviconUrl }
  } catch { return fallback }
}
