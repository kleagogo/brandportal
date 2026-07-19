/**
 * Website brand scanner — the "paste your URL" magic.
 *
 * Reads the page AND its stylesheets, then extracts:
 *  - a real color palette (frequency-ranked, saturation-filtered, hue-clustered)
 *  - the actual logo (og:image / apple-touch-icon / <img> heuristics)
 *  - imagery from the page (large images, absolutized)
 *  - typefaces (Google Fonts links + font-family declarations)
 *  - name, tagline, favicon
 */

import * as cheerio from 'cheerio'

export interface SemanticColors {
  buttonBg?: string
  buttonText?: string
  link?: string
  bodyText?: string
  heading?: string
  background?: string
}

export interface ScannedBrand {
  brandName: string
  tagline: string
  primaryColor: string
  accentColor?: string
  /** Extra brand color candidates, strongest first. */
  extraColors: string[]
  backgroundColor: string
  /** Colors by role, read from the site's actual CSS rules. */
  semantic: SemanticColors
  fontFamily: string
  headingFont?: string
  /** Real sizes from body{}/h1{} rules, when found (e.g. "16px"). */
  bodySize?: string
  headingSize?: string
  logoUrl?: string
  faviconUrl?: string
  images: string[]
  originalUrl: string
}

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 BrandPortalBot/1.0',
  'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

export async function scanWebsite(url: string): Promise<ScannedBrand> {
  const res = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(9000), redirect: 'follow' })
  const html = await res.text()
  const finalUrl = res.url || url
  const $ = cheerio.load(html)
  const origin = new URL(finalUrl).origin
  const hostname = new URL(finalUrl).hostname.replace(/^www\./, '')

  // ── Stylesheets: fetch up to 4 linked CSS files (they hold the real palette)
  const cssLinks = $('link[rel="stylesheet"]')
    .map((_, el) => $(el).attr('href'))
    .get()
    .filter(Boolean)
    .map(href => absolutize(href!, finalUrl))
    .filter((u): u is string => Boolean(u))
    .slice(0, 4)

  const inlineCss = $('style').map((_, el) => $(el).text()).get().join('\n')
  const fetchedCss = await Promise.all(cssLinks.map(async link => {
    try {
      const r = await fetch(link, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(6000) })
      if (!r.ok) return ''
      const text = await r.text()
      return text.length > 400_000 ? text.slice(0, 400_000) : text
    } catch { return '' }
  }))
  const styleAttrCss = $('[style]').map((_, el) => `x{${$(el).attr('style')}}`).get().join('\n')
  const cssOnly = `${inlineCss}\n${fetchedCss.join('\n')}\n${styleAttrCss}`
  const allCss = `${cssOnly}\n${html}`

  // ── Semantic pass: what the site's CSS says about roles
  const rules = parseRules(cssOnly)
  const vars = buildVarMap(rules)
  const semantic = extractSemantic(rules, vars)
  const sizes = extractSizes(rules)

  // ── Colors
  const themeColor = normalizeHex($('meta[name="theme-color"]').attr('content') || '')
  const { primary, accent, extras, background } = extractPalette(allCss, themeColor, vars, semantic)

  // ── Identity
  const ogSiteName = $('meta[property="og:site_name"]').attr('content')
  const title = ($('title').first().text() || '').replace(/\s*[|\-–—:·]\s*.+$/, '').trim()
  const brandName = (ogSiteName || title || hostname.split('.')[0]).trim()
  const tagline = (
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') || ''
  ).trim().slice(0, 140)

  // ── Logo + favicon
  const logoUrl = findLogo($, finalUrl)
  const faviconHref = $('link[rel="icon"], link[rel="shortcut icon"]').first().attr('href')
  const faviconUrl = faviconHref
    ? absolutize(faviconHref, finalUrl) || undefined
    : `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`

  // ── Imagery
  const images = findImages($, finalUrl, logoUrl)

  // ── Typography
  const { bodyFont, headingFont } = extractFonts($, allCss)

  return {
    brandName: brandName.charAt(0).toUpperCase() + brandName.slice(1),
    tagline,
    primaryColor: primary,
    accentColor: accent,
    extraColors: extras,
    backgroundColor: semantic.background || background,
    semantic,
    fontFamily: bodyFont,
    headingFont,
    bodySize: sizes.bodySize,
    headingSize: sizes.headingSize,
    logoUrl,
    faviconUrl,
    images,
    originalUrl: finalUrl,
  }
}

// ─── CSS rule parsing & semantic roles ────────────────────────────────────────

interface CssRule { sel: string; decls: string }

function parseRules(css: string): CssRule[] {
  const clean = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Flatten @media/@supports wrappers so inner rules still parse.
    .replace(/@(media|supports|layer|container)[^{;]*\{/g, '')
  const out: CssRule[] = []
  for (const chunk of clean.split('}')) {
    const i = chunk.lastIndexOf('{')
    if (i === -1) continue
    const sel = chunk.slice(0, i).trim().toLowerCase()
    if (!sel || sel.startsWith('@')) continue
    out.push({ sel, decls: chunk.slice(i + 1).toLowerCase() })
  }
  return out
}

/** CSS custom properties (--brand: #...) — where modern sites keep the palette. */
function buildVarMap(rules: CssRule[]): Map<string, string> {
  const raw = new Map<string, string>()
  for (const rule of rules) {
    for (const m of rule.decls.matchAll(/--([\w-]+)\s*:\s*([^;]+)/g)) {
      if (!raw.has(m[1])) raw.set(m[1], m[2].trim())
    }
  }
  // Resolve var-to-var chains into concrete hex values.
  const resolved = new Map<string, string>()
  for (const [name, value] of raw) {
    const hex = resolveColorValue(value, raw, 0)
    if (hex) resolved.set(name, hex)
  }
  return resolved
}

function resolveColorValue(value: string, raw: Map<string, string>, depth: number): string | null {
  if (depth > 3) return null
  const v = value.trim()
  const varRef = v.match(/var\(\s*--([\w-]+)/)
  if (varRef) {
    const next = raw.get(varRef[1])
    return next ? resolveColorValue(next, raw, depth + 1) : null
  }
  const hex = normalizeHex(v.match(/#[0-9a-f]{3,8}\b/i)?.[0] || '')
  if (hex) return hex
  const rgb = v.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/)
  if (rgb) return rgbToHex(+rgb[1], +rgb[2], +rgb[3])
  if (/^white$/i.test(v)) return '#ffffff'
  if (/^black$/i.test(v)) return '#000000'
  return null
}

/** Read role colors from the rules that define them. */
function extractSemantic(rules: CssRule[], vars: Map<string, string>): SemanticColors {
  const buckets: Record<keyof SemanticColors, Map<string, number>> = {
    buttonBg: new Map(), buttonText: new Map(), link: new Map(),
    bodyText: new Map(), heading: new Map(), background: new Map(),
  }

  const grab = (bucket: Map<string, number>, decls: string, prop: 'color' | 'background', weight = 1) => {
    const pattern = prop === 'color'
      ? /(?:^|;)\s*color\s*:\s*([^;]+)/g
      : /(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/g
    for (const m of decls.matchAll(pattern)) {
      const hex = resolveColorValue(m[1], varsAsRaw(vars), 0)
      if (hex) bucket.set(hex, (bucket.get(hex) || 0) + weight)
    }
  }

  for (const { sel, decls } of rules) {
    const isButton = /(^|[\s,>+~(])button\b|\.btn\b|btn-|button--|\[type="?submit|\bcta\b/.test(sel)
    const isLink = /(^|[\s,])a\b(?![\w-])/.test(sel) && !sel.includes('button')
    const isBody = /(^|,|\s)(body|html)\s*(,|$)/.test(sel)
    const isHeading = /(^|[\s,])h[123]\b/.test(sel)
    const isHover = sel.includes(':hover') || sel.includes(':focus') || sel.includes(':active')
    const weight = isHover ? 0.5 : 1

    if (isButton) {
      grab(buckets.buttonBg, decls, 'background', weight)
      grab(buckets.buttonText, decls, 'color', weight)
    }
    if (isLink) grab(buckets.link, decls, 'color', weight)
    if (isBody) {
      grab(buckets.bodyText, decls, 'color', weight)
      grab(buckets.background, decls, 'background', weight)
    }
    if (isHeading) grab(buckets.heading, decls, 'color', weight)
  }

  const top = (bucket: Map<string, number>, opts?: { noTransparentish?: boolean }): string | undefined => {
    const ranked = [...bucket.entries()].sort((a, b) => b[1] - a[1])
    for (const [hex] of ranked) {
      if (opts?.noTransparentish && (hex === '#ffffff' || hex === '#000000')) continue
      return hex
    }
    return ranked[0]?.[0]
  }

  return {
    buttonBg: top(buckets.buttonBg, { noTransparentish: true }) || top(buckets.buttonBg),
    buttonText: top(buckets.buttonText),
    link: top(buckets.link),
    bodyText: top(buckets.bodyText),
    heading: top(buckets.heading),
    background: top(buckets.background),
  }
}

/** Adapt a resolved var map back to the raw shape resolveColorValue expects. */
function varsAsRaw(vars: Map<string, string>): Map<string, string> {
  return vars
}

function extractSizes(rules: CssRule[]): { bodySize?: string; headingSize?: string } {
  let bodySize: string | undefined
  let headingSize: string | undefined
  for (const { sel, decls } of rules) {
    const size = decls.match(/(?:^|;)\s*font-size\s*:\s*(\d+(?:\.\d+)?(?:px|rem))/)?.[1]
    if (!size) continue
    if (!bodySize && /(^|,|\s)(body|html)\s*(,|$)/.test(sel)) bodySize = size
    if (!headingSize && /(^|[\s,])h1\b/.test(sel)) headingSize = size
  }
  return { bodySize, headingSize }
}

// ─── Colors ───────────────────────────────────────────────────────────────────

function extractPalette(css: string, themeColor: string | null, vars: Map<string, string>, semantic: SemanticColors): {
  primary: string; accent?: string; extras: string[]; background: string
} {
  const counts = new Map<string, number>()

  for (const match of css.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
    const hex = normalizeHex(match[0])
    if (hex) counts.set(hex, (counts.get(hex) || 0) + 1)
  }
  for (const match of css.matchAll(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)/g)) {
    if (match[4] !== undefined && parseFloat(match[4]) < 0.6) continue // skip transparent
    const hex = rgbToHex(+match[1], +match[2], +match[3])
    if (hex) counts.set(hex, (counts.get(hex) || 0) + 1)
  }

  // Colors defined as CSS variables are deliberate design tokens — boost them.
  for (const hex of vars.values()) {
    counts.set(hex, (counts.get(hex) || 0) + 15)
  }
  // Colors serving a semantic role (button, link) are certainly brand colors.
  for (const hex of [semantic.buttonBg, semantic.link, semantic.heading]) {
    if (hex) counts.set(hex, (counts.get(hex) || 0) + 30)
  }
  // The site's declared theme color is a strong signal.
  if (themeColor) counts.set(themeColor, (counts.get(themeColor) || 0) + 40)

  // Brand candidates: saturated, neither near-white nor near-black.
  const candidates = [...counts.entries()]
    .map(([hex, count]) => ({ hex, count, ...hsl(hex) }))
    .filter(c => c.s >= 0.28 && c.l >= 0.18 && c.l <= 0.82)
    .sort((a, b) => b.count - a.count)

  const picked: Array<{ hex: string; h: number }> = []
  for (const c of candidates) {
    // Keep colors with meaningfully different hues (or very different lightness).
    const clash = picked.some(p => hueDistance(p.h, c.h) < 30)
    if (!clash) picked.push({ hex: c.hex, h: c.h })
    if (picked.length >= 5) break
  }

  const primary = picked[0]?.hex || themeColor || '#1a1a1a'
  const accent = picked[1]?.hex
  const extras = picked.slice(2).map(p => p.hex)

  // Background: most common very-light color, else white.
  const light = [...counts.entries()]
    .map(([hex, count]) => ({ hex, count, ...hsl(hex) }))
    .filter(c => c.l > 0.93)
    .sort((a, b) => b.count - a.count)
  const background = light[0]?.hex || '#ffffff'

  return { primary, accent, extras, background }
}

export function normalizeHex(v: string | null | undefined): string | null {
  if (!v) return null
  let h = v.trim().toLowerCase()
  if (!h.startsWith('#')) return null
  if (/^#[0-9a-f]{3}$/.test(h)) h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`
  if (/^#[0-9a-f]{8}$/.test(h)) h = h.slice(0, 7)
  return /^#[0-9a-f]{6}$/.test(h) ? h : null
}

function rgbToHex(r: number, g: number, b: number): string | null {
  if ([r, g, b].some(v => v > 255)) return null
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`
}

function hsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60
  else if (max === g) h = ((b - r) / d + 2) * 60
  else h = ((r - g) / d + 4) * 60
  return { h, s, l }
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b)
  return Math.min(d, 360 - d)
}

// ─── Logo & imagery ───────────────────────────────────────────────────────────

function findLogo($: cheerio.CheerioAPI, baseUrl: string): string | undefined {
  // <img> that self-identifies as a logo, in the header/nav if possible.
  const imgCandidates = $('header img, nav img, a[href="/"] img, img')
    .toArray()
    .map(el => {
      const $el = $(el)
      const src = $el.attr('src') || $el.attr('data-src') || ''
      const hint = `${src} ${$el.attr('class') || ''} ${$el.attr('alt') || ''} ${$el.attr('id') || ''}`.toLowerCase()
      return { src, isLogo: hint.includes('logo') }
    })
    .filter(c => c.src && c.isLogo)
  if (imgCandidates[0]) return absolutize(imgCandidates[0].src, baseUrl) || undefined

  // High-res icon beats the favicon.
  const appleIcon = $('link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]').first().attr('href')
  if (appleIcon) return absolutize(appleIcon, baseUrl) || undefined

  const ogImage = $('meta[property="og:image"]').attr('content')
  if (ogImage) return absolutize(ogImage, baseUrl) || undefined

  return undefined
}

function findImages($: cheerio.CheerioAPI, baseUrl: string, logoUrl?: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()

  const push = (src: string | undefined) => {
    if (!src) return
    const abs = absolutize(src, baseUrl)
    if (!abs || seen.has(abs) || abs === logoUrl) return
    if (!/\.(jpe?g|png|webp)(\?|$)/i.test(abs) && !abs.includes('og')) return
    if (/(sprite|icon|favicon|pixel|tracking|badge|1x1)/i.test(abs)) return
    seen.add(abs)
    out.push(abs)
  }

  push($('meta[property="og:image"]').attr('content'))
  for (const el of $('img').toArray()) {
    if (out.length >= 4) break
    const $el = $(el)
    const w = parseInt($el.attr('width') || '0', 10)
    const h = parseInt($el.attr('height') || '0', 10)
    const src = $el.attr('src') || $el.attr('data-src')
    // Keep images that are large, or unsized but plausibly photographic.
    if ((w >= 300 && h >= 200) || (!w && !h)) push(src || undefined)
  }
  return out.slice(0, 4)
}

// ─── Typography ───────────────────────────────────────────────────────────────

const GENERIC_FONTS = new Set(['sans-serif', 'serif', 'monospace', 'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace', 'cursive', 'fantasy', 'inherit', 'initial', 'unset', 'var', 'apple-system', '-apple-system', 'blinkmacsystemfont', 'segoe ui', 'roboto flex', 'helvetica', 'helvetica neue', 'arial', 'times', 'times new roman', 'courier', 'courier new'])

function extractFonts($: cheerio.CheerioAPI, css: string): { bodyFont: string; headingFont?: string } {
  // Google Fonts links tell us which families the site actually loads.
  const googleFamilies: string[] = []
  $('link[href*="fonts.googleapis.com"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    for (const m of href.matchAll(/family=([A-Za-z0-9+ ]+)/g)) {
      googleFamilies.push(m[1].replace(/\+/g, ' ').trim())
    }
  })

  const firstFamily = (decl: string): string | null => {
    const first = decl.split(',')[0].replace(/['"]/g, '').trim().toLowerCase()
    if (!first || first.startsWith('var(') || GENERIC_FONTS.has(first)) return null
    return first
  }

  // Which family does the body use? Which do headings use?
  const bodyRule = css.match(/(?:^|[}\s])(?:body|html)\s*(?:,[^{]*)?\{[^}]*?font-family\s*:\s*([^;}]+)/i)
  const headingRule = css.match(/(?:^|[}\s])h[123][^{]*\{[^}]*?font-family\s*:\s*([^;}]+)/i)
  const bodyDeclared = bodyRule ? firstFamily(bodyRule[1]) : null
  const headingDeclared = headingRule ? firstFamily(headingRule[1]) : null

  // All font-family declarations, frequency-ranked, as fallback.
  const counts = new Map<string, number>()
  for (const m of css.matchAll(/font-family\s*:\s*([^;}]+)[;}]/gi)) {
    const first = firstFamily(m[1])
    if (first) counts.set(first, (counts.get(first) || 0) + 1)
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name)

  const body = bodyDeclared || ranked[0] || googleFamilies[0]?.toLowerCase() || 'inter'
  const heading = headingDeclared && headingDeclared !== body
    ? headingDeclared
    : googleFamilies.map(f => f.toLowerCase()).find(f => f !== body) || ranked.find(r => r !== body)

  return {
    bodyFont: titleCase(body),
    headingFont: heading ? titleCase(heading) : undefined,
  }
}

function titleCase(v: string): string {
  return v.replace(/\b\w/g, ch => ch.toUpperCase())
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function absolutize(href: string, base: string): string | null {
  try {
    const u = new URL(href, base)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}
