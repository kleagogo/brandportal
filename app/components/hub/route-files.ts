'use client'

/**
 * Working out where a dropped folder's files belong.
 *
 * Dropping a client's brand folder used to pile everything into whichever
 * section happened to be open, so a folder called "motion" landed under Logo.
 * This reads the folder names and file types instead, and sorts the drop into
 * the hub's own sections — proposing a new section for anything that clearly
 * belongs somewhere the hub doesn't have yet.
 *
 * Folder names decide almost everything, so the rules below run first and cost
 * nothing. Whatever they can't place is what the AI pass gets asked about.
 */

import type { SectionConfig } from '@/app/types/brand'
import type { PickedFile } from './pick-files'

/** One group of files headed for the same place, as the review dialog shows it. */
export interface ImportBucket {
  /** Stable key for React lists and for matching an AI answer back to a bucket. */
  key: string
  /** The folder this came from, '' for files dropped at the top level. */
  folder: string
  /** Existing section to file under, or null when a new section is proposed. */
  sectionId: string | null
  /** Section label — the existing one, or the name proposed for a new section. */
  label: string
  /** Icon for a proposed new section. Unused when `sectionId` is set. */
  icon: SectionConfig['icon']
  items: PickedFile[]
  /** How this was decided, so the dialog can be honest about its confidence. */
  via: 'folder' | 'filetype' | 'ai' | 'unmatched'
}

/**
 * Folder words that name a kind of brand asset. Deliberately tight: sending a
 * folder to the wrong section is worse than admitting we don't know and
 * offering to make a section for it.
 */
const ALIASES: Record<string, string[]> = {
  logo: ['logo', 'logos', 'logotype', 'logotypes', 'wordmark', 'wordmarks', 'mark', 'marks', 'brandmark', 'lockup', 'lockups'],
  colors: ['color', 'colors', 'colour', 'colours', 'palette', 'palettes', 'swatch', 'swatches', 'gradient', 'gradients'],
  typography: ['type', 'typography', 'typeface', 'typefaces', 'font', 'fonts', 'webfont', 'webfonts'],
  screenshots: ['screenshot', 'screenshots', 'screens', 'screengrab', 'screengrabs'],
  artwork: ['artwork', 'art', 'illustration', 'illustrations', 'graphic', 'graphics', 'pattern', 'patterns', 'texture', 'textures'],
  guidelines: ['guideline', 'guidelines', 'brandbook', 'manual', 'manuals', 'standards'],
  templates: ['template', 'templates', 'letterhead', 'letterheads', 'stationery'],
  inspiration: ['inspiration', 'inspo', 'moodboard', 'moodboards', 'reference', 'references'],
}

/** File types that speak for themselves when the folder name doesn't. */
const BY_EXTENSION: Record<string, string> = {
  ttf: 'typography', otf: 'typography', woff: 'typography', woff2: 'typography', eot: 'typography',
  ase: 'colors', aco: 'colors', clr: 'colors',
}

/** Icon to give a section we're proposing, guessed from its name. */
const ICON_HINTS: Array<[RegExp, SectionConfig['icon']]> = [
  [/logo|mark|wordmark/, 'logo'],
  [/colou?r|palette|swatch|gradient/, 'colors'],
  [/font|type|typeface/, 'type'],
  [/screen|ui|product/, 'screenshots'],
  [/motion|video|animat|film/, 'artwork'],
  [/photo|image|picture|shot/, 'screenshots'],
  [/guide|manual|standard|doc/, 'guidelines'],
  [/template|letterhead|stationery|deck|slide|presentation/, 'templates'],
  [/inspir|mood|reference/, 'sparkles'],
  [/icon|symbol/, 'logo'],
  [/mail|signature|email/, 'mail'],
]

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function extensionOf(name: string): string {
  return (name.split('.').pop() || '').toLowerCase()
}

/** Title-case a folder name for use as a section label. */
export function labelFromFolder(folder: string): string {
  const words = normalize(folder).split(' ').filter(Boolean)
  if (!words.length) return 'New files'
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').slice(0, 40)
}

export function iconForLabel(label: string): SectionConfig['icon'] {
  const n = normalize(label)
  for (const [pattern, icon] of ICON_HINTS) {
    if (pattern.test(n)) return icon
  }
  return 'screenshots'
}

/**
 * Every word that should route a folder to this section: its own name first,
 * so a hub with a renamed or custom section still matches a folder named after
 * it, then the generic aliases for what that section holds.
 */
function keywordsFor(section: SectionConfig): Set<string> {
  const words = new Set<string>()
  for (const word of normalize(section.label).split(' ')) {
    if (word) words.add(word)
  }
  words.add(normalize(section.id).replace(/ /g, ''))
  for (const word of normalize(section.id).split(' ')) {
    if (word) words.add(word)
  }
  // Aliases are keyed by the stock section ids; a hub that renamed "Logo" to
  // "Marks" still matches through its own label above.
  for (const [concept, list] of Object.entries(ALIASES)) {
    if (section.id === concept || section.type === concept) {
      for (const alias of list) words.add(alias)
    }
  }
  return words
}

/** Which section, if any, a single folder segment names. */
function sectionForSegment(segment: string, sections: SectionConfig[]): SectionConfig | null {
  const seg = normalize(segment)
  if (!seg) return null
  const segTight = seg.replace(/ /g, '')
  for (const section of sections) {
    if (section.type !== 'assets' && section.type !== 'colors' && section.type !== 'typography' && section.type !== 'guidelines') continue
    const words = keywordsFor(section)
    if (words.has(seg) || words.has(segTight)) return section
    // "logo files" or "brand logos" should still find Logo.
    for (const word of seg.split(' ')) {
      if (word.length > 2 && words.has(word)) return section
    }
  }
  return null
}

/**
 * Sort a drop into buckets.
 *
 * Files dropped loose (no folder) stay with the section the person is looking
 * at — they chose it by being there. Everything inside a folder is routed on
 * what the folder is called, and falls back to what the files are.
 */
export function planImport(
  picked: PickedFile[],
  sections: SectionConfig[],
  currentSectionId: string
): ImportBucket[] {
  const buckets = new Map<string, ImportBucket>()

  const push = (key: string, make: () => Omit<ImportBucket, 'items' | 'key'>, item: PickedFile, subgroup: string) => {
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { key, items: [], ...make() }
      buckets.set(key, bucket)
    }
    // The folder that decided the section shouldn't also become a heading
    // inside it; only the levels below it are worth keeping as groups.
    bucket.items.push({ ...item, path: subgroup })
  }

  for (const item of picked) {
    const segments = item.path ? item.path.split('/').filter(Boolean) : []

    if (!segments.length) {
      const current = sections.find(s => s.id === currentSectionId)
      push(
        `section:${currentSectionId}`,
        () => ({
          folder: '',
          sectionId: currentSectionId,
          label: current?.label || 'Files',
          icon: current?.icon || 'screenshots',
          via: 'folder' as const,
        }),
        item,
        ''
      )
      continue
    }

    // The outermost folder that names a section wins — "Brand/logos/primary"
    // is a Logo drop with a "primary" group inside it.
    let matchedAt = -1
    let matched: SectionConfig | null = null
    for (let i = 0; i < segments.length; i++) {
      const found = sectionForSegment(segments[i], sections)
      if (found) { matchedAt = i; matched = found; break }
    }

    if (matched) {
      push(
        `section:${matched.id}`,
        () => ({ folder: segments[matchedAt], sectionId: matched!.id, label: matched!.label, icon: matched!.icon, via: 'folder' as const }),
        item,
        segments.slice(matchedAt + 1).join('/')
      )
      continue
    }

    // Nothing recognised — keep it under its own top folder for now, and let
    // the file-type pass or the AI pass decide where it goes.
    const folder = segments[0]
    push(
      `folder:${normalize(folder)}`,
      () => ({ folder, sectionId: null, label: labelFromFolder(folder), icon: iconForLabel(folder), via: 'unmatched' as const }),
      item,
      segments.slice(1).join('/')
    )
  }

  // A folder of nothing but fonts is a typography folder whatever it's called.
  for (const bucket of buckets.values()) {
    if (bucket.sectionId || !bucket.items.length) continue
    const hints = bucket.items.map(i => BY_EXTENSION[extensionOf(i.file.name)]).filter(Boolean)
    if (hints.length !== bucket.items.length) continue
    const concept = hints[0]
    if (!hints.every(h => h === concept)) continue
    const target = sections.find(s => s.id === concept || s.type === concept)
    if (target) {
      bucket.sectionId = target.id
      bucket.label = target.label
      bucket.icon = target.icon
      bucket.via = 'filetype'
    }
  }

  return [...buckets.values()]
}

/** The folders the rules couldn't place — what the AI pass is asked about. */
export function unplaced(buckets: ImportBucket[]): ImportBucket[] {
  return buckets.filter(b => b.sectionId === null)
}

/**
 * Fold the AI's answers back into the plan.
 *
 * Answers naming a section that no longer exists are ignored rather than
 * trusted — the plan stays as the rules left it, which is a new section.
 */
export function applyAnswers(
  buckets: ImportBucket[],
  answers: Array<{ key: string; sectionId?: string | null; label?: string }>,
  sections: SectionConfig[]
): ImportBucket[] {
  const byKey = new Map(answers.map(a => [a.key, a]))
  return buckets.map(bucket => {
    const answer = byKey.get(bucket.key)
    if (!answer || bucket.sectionId !== null) return bucket
    if (answer.sectionId) {
      const target = sections.find(s => s.id === answer.sectionId)
      if (target) {
        return { ...bucket, sectionId: target.id, label: target.label, icon: target.icon, via: 'ai' as const }
      }
    }
    if (answer.label) {
      return { ...bucket, label: answer.label.slice(0, 40), icon: iconForLabel(answer.label), via: 'ai' as const }
    }
    return bucket
  })
}
