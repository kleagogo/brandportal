import type { BrandConfig, SectionConfig } from '@/app/types/brand'

/**
 * Bringing an existing hub up to the current layout.
 *
 * A hub's sidebar is stored, not computed: the section list is written when
 * the hub is created and never revisited. So sections added to the product
 * afterwards exist for new hubs and are simply absent from older ones.
 *
 * This runs on read rather than as a bulk write over the database — there is
 * no migration event to schedule or roll back, and a hub nobody opens is a
 * hub nobody needed migrated. `schemaVersion` records what a hub has already
 * seen, which is what stops a section its owner deleted from coming back on
 * the next page load.
 */
export const CURRENT_SCHEMA = 1

/** Sections added in v1: the written half of a brand book. */
const V1_DOC_SECTIONS: SectionConfig[] = [
  { id: 'brand-story',       label: 'Brand Story',            type: 'doc', icon: 'book',        group: 'assets' },
  { id: 'brand-personality', label: 'Brand Personality',      type: 'doc', icon: 'fingerprint', group: 'assets' },
  { id: 'visual-identity',   label: 'Visual Identity',        type: 'doc', icon: 'eye',         group: 'assets' },
  { id: 'brand-voice',       label: 'Brand Voice',            type: 'doc', icon: 'chat',        group: 'assets' },
  { id: 'photography',       label: 'Photography Guidelines', type: 'doc', icon: 'camera',      group: 'assets' },
]

/**
 * Returns the hub unchanged when there is nothing to do, so callers can use
 * the identity of the result to decide whether a save is worth doing.
 */
export function migrateHub(config: BrandConfig): BrandConfig {
  if ((config.schemaVersion || 0) >= CURRENT_SCHEMA) return config

  const taken = new Set(config.sections.map(s => s.id))
  const missing = V1_DOC_SECTIONS.filter(s => !taken.has(s.id))

  // Nothing to add is still a migration: recording it means we stop asking.
  if (!missing.length) return { ...config, schemaVersion: CURRENT_SCHEMA }

  // After Guidelines, where they read in order — the rules, then the thinking
  // behind them. At the end if this hub has no Guidelines section.
  const sections = [...config.sections]
  const at = sections.findIndex(s => s.type === 'guidelines')
  sections.splice(at === -1 ? sections.length : at + 1, 0, ...missing)

  return { ...config, sections, schemaVersion: CURRENT_SCHEMA }
}
