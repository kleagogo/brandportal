import type { BrandConfig, FontConfig } from '@/app/types/brand'

/**
 * Turning dropped font files into typefaces.
 *
 * The importer has always recognised fonts — by folder name, by extension,
 * even "a folder of nothing but fonts is a typography folder" — and then
 * filed them where the Typography page never looks, because that page reads
 * the structured typeface list, not the file store. These helpers are the
 * missing half: a file like Onest-SemiBold.woff2 becomes (or joins) the
 * "Onest" typeface, carrying its weight, and the @font-face below is what
 * makes the specimens actually render in it.
 */

const FONT_EXTENSIONS = ['otf', 'ttf', 'woff', 'woff2', 'eot']

export function isFontFile(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  return FONT_EXTENSIONS.includes(ext)
}

/** Foundries spell weights many ways; CSS has nine numbers. */
const WEIGHT_TOKENS: Record<string, string> = {
  thin: '100', hairline: '100',
  extralight: '200', ultralight: '200',
  light: '300',
  regular: '400', normal: '400', book: '400', roman: '400',
  medium: '500',
  semibold: '600', demibold: '600', demi: '600',
  bold: '700',
  extrabold: '800', ultrabold: '800', heavy: '800',
  black: '900',
}

export interface ParsedFontName {
  family: string
  weight: string
  italic: boolean
  /** "SemiBold Italic" — for the download's label. */
  cut: string
}

/**
 * "Onest-SemiBoldItalic.woff2" → { family: "Onest", weight: "600", italic }.
 *
 * Family is whatever precedes the first recognised weight/style token; the
 * tokens themselves become the weight. A name with no tokens is a Regular.
 */
export function parseFontFilename(filename: string): ParsedFontName {
  const stem = filename.replace(/\.[^.]+$/, '')
  // Split camelCase, dashes and underscores into words.
  const words = stem
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[-_\s]+/)
    .filter(Boolean)

  let weight = ''
  let italic = false
  const familyWords: string[] = []
  const cutWords: string[] = []

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const key = word.toLowerCase()
    // The camelCase split turns SemiBold into two words; pairs are checked
    // before singles so "Semi" never lands in the family name.
    const pair = i + 1 < words.length ? key + words[i + 1].toLowerCase() : ''
    if (pair && WEIGHT_TOKENS[pair] && familyWords.length > 0) {
      weight = WEIGHT_TOKENS[pair]
      cutWords.unshift(word[0].toUpperCase() + word.slice(1) + words[i + 1])
      i++
      continue
    }
    if (key === 'italic' || key === 'oblique') {
      italic = true
      cutWords.push('Italic')
      continue
    }
    if (WEIGHT_TOKENS[key] && familyWords.length > 0) {
      weight = WEIGHT_TOKENS[key]
      cutWords.unshift(word[0].toUpperCase() + word.slice(1))
      continue
    }
    // Numeric weights: Onest-600.woff2
    if (/^[1-9]00$/.test(key) && familyWords.length > 0) {
      weight = key
      cutWords.unshift(key)
      continue
    }
    // Version-ish, format-ish and optical-size tokens carry no meaning here.
    if (/^v?\d+$/.test(key) || /^\d+pt$/.test(key) || key === 'webfont' || key === 'web') continue
    if (!weight && !italic) familyWords.push(word)
  }

  // "inter" is a filename habit, not a name. Words that arrive all-lowercase
  // get their capital back; mixed-case ones are left exactly as written.
  const family = familyWords
    .map(w => (w === w.toLowerCase() ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')

  return {
    family: family || stem,
    weight: weight || '400',
    italic,
    cut: cutWords.join(' ') || 'Regular',
  }
}

/**
 * File one uploaded font into the typeface list. Mutates the draft config —
 * call inside `update()`. Same family joins the same typeface; a new family
 * becomes a new one, in the last group so uploads land where the eye already
 * is, creating the first group when none exists.
 */
export function addFontFile(c: BrandConfig, filename: string, url: string): FontConfig {
  const parsed = parseFontFilename(filename)

  let font: FontConfig | undefined
  for (const group of c.typography) {
    font = group.fonts.find(f => f.name.toLowerCase() === parsed.family.toLowerCase())
    if (font) break
  }

  if (!font) {
    if (c.typography.length === 0) c.typography.push({ group: 'Brand typefaces', fonts: [] })
    font = {
      name: parsed.family,
      role: 'Uploaded typeface',
      weights: [],
      usage: '',
      // No importUrl: this face loads from the uploaded file, not Google.
      specimens: [{ label: 'Sample', size: '20px', weight: parsed.weight, sample: 'The quick brown fox jumps over the lazy dog' }],
      downloads: [],
    }
    c.typography[c.typography.length - 1].fonts.push(font)
  }

  if (!font.weights.includes(parsed.weight)) {
    font.weights = [...font.weights, parsed.weight].sort((a, b) => Number(a) - Number(b))
  }
  if (!font.downloads) font.downloads = []
  // Re-uploading the same cut replaces the file rather than stacking a twin.
  const existing = font.downloads.find(d => d.weight === parsed.weight && Boolean(d.italic) === parsed.italic)
  if (existing) {
    existing.file = url
    existing.label = parsed.cut
  } else {
    font.downloads.push({ label: parsed.cut, file: url, weight: parsed.weight, italic: parsed.italic })
  }
  return font
}

const FACE_FORMATS: Record<string, string> = {
  woff2: 'woff2', woff: 'woff', otf: 'opentype', ttf: 'truetype',
}

/**
 * The @font-face rules for every uploaded font file in the hub. Google-hosted
 * faces come in through their stylesheet link; these are the ones we host.
 */
export function customFontFaceCss(config: BrandConfig): string {
  const rules: string[] = []
  for (const group of config.typography) {
    for (const font of group.fonts) {
      for (const d of font.downloads || []) {
        if (!d.file || !d.weight) continue
        const ext = d.file.split('.').pop()?.toLowerCase() || ''
        const format = FACE_FORMATS[ext]
        rules.push(
          `@font-face{font-family:'${font.name.replace(/'/g, '')}';` +
          `src:url('${d.file}')${format ? ` format('${format}')` : ''};` +
          `font-weight:${d.weight};font-style:${d.italic ? 'italic' : 'normal'};font-display:swap;}`
        )
      }
    }
  }
  return rules.join('\n')
}
