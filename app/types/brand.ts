export interface ColorSwatch {
  name: string
  hex: string
  usage?: string
}

export interface ColorGroup {
  group: string
  swatches: ColorSwatch[]
}

export interface GradientDef {
  name: string
  /** Full CSS gradient value, e.g. "linear-gradient(90deg, #a 0%, #b 100%)". */
  css: string
  /** Show a Download control (renders the gradient to a PNG client-side). */
  downloadable?: boolean
}

export interface GradientGroup {
  group: string
  gradients: GradientDef[]
}

export interface TypeSpecimen {
  label: string
  size: string
  weight: string
  /** Letter-spacing note, e.g. "-4%". */
  kerning?: string
  /** Line-height note, e.g. "90%". */
  lineHeight?: string
  sample: string
}

export interface FontDownload {
  label: string
  file?: string
  /** CSS weight this file carries, e.g. "600". Set for uploaded font files
   *  so the @font-face rule can say which weight the file is. */
  weight?: string
  /** The file is the italic cut. */
  italic?: boolean
}

export interface FontConfig {
  name: string
  role: string
  weights: string[]
  usage: string
  /** A longer note than `usage` — provenance, licensing, where it came from. */
  description?: string
  importUrl?: string
  /** e.g. "Primary — All UI, Headings & Body". */
  primaryLabel?: string
  /** e.g. "font-family: 'Camera Plain', system-ui, sans-serif;". */
  cssSnippet?: string
  /** Installable font files. */
  downloads?: FontDownload[]
  specimens: TypeSpecimen[]
}

export interface TypographyGroup {
  group: string
  fonts: FontConfig[]
}

export type SectionType = 'assets' | 'colors' | 'typography' | 'guidelines' | 'link' | 'tokens' | 'home' | 'gradients' | 'subbrand' | 'doc'
export type SectionIcon = 'home' | 'logo' | 'colors' | 'type' | 'screenshots' | 'artwork' | 'video' | 'guidelines' | 'link' | 'heart' | 'mail' | 'person' | 'templates' | 'sparkles' | 'file' | 'book' | 'fingerprint' | 'eye' | 'camera' | 'chat'
export type SectionGroup = 'main' | 'assets' | 'subbrands' | 'tools' | 'resources'

export interface SectionConfig {
  id: string
  label: string
  type: SectionType
  icon: SectionIcon
  url?: string // for type: 'link' and 'subbrand'
  /** Sidebar group. Defaults to 'assets'. */
  group?: SectionGroup
  /**
   * Studio-only furniture — case studies, proposal decks and the like. Lives
   * in the agency's own hub and is left behind when a new client space copies
   * that hub's layout. Anything without this flag travels.
   */
  studioOnly?: boolean
}

export interface AssetVersion {
  /** v1, v2, … assigned on upload. */
  label: string
  file: string
  format: string
  /** Bytes stored, for the hub's usage total. */
  bytes?: number
  /** ISO timestamp. */
  uploadedAt: string
  /** Who uploaded it (email), when known. */
  uploadedBy?: string
  note?: string
}

export interface AssetFile {
  name: string
  file: string
  format: string[]
  /** Bytes stored. Absent on files uploaded before usage was tracked. */
  bytes?: number
  usage?: string
  tags?: string[]
  /** Version history, oldest first. The live `file` is the approved one. */
  versions?: AssetVersion[]
  /** Label of the approved/current version, e.g. "v3". */
  approvedVersion?: string
  /** Named sub-group within a section, e.g. "Lockup", "Logomark", "Web". */
  subgroup?: string
  /** Aspect hint for the preview tile: 'wide' (16:9) or 'portrait' (9:16). */
  ratio?: 'square' | 'wide' | 'portrait'
  /** Open in a new tab instead of downloading (Figma templates etc.). */
  external?: boolean
  platform?: string
  description?: string
}

export interface GuidelinePrinciple {
  name: string
  description: string
}

export interface AgentConfig {
  enabled: boolean
  name: string
  greeting: string
  model: string
  /** Home-page hero subtitle. */
  home?: string
  /** Quick-prompt chips on the home page. */
  prompts?: string[]
}

/** How a shared portal presents the brand. */
export type PortalTemplate = 'full' | 'gallery' | 'minimal'

export interface PortalBranding {
  /** Agency (or client) logo shown instead of the hub's. */
  logoUrl?: string
  /** Name in the portal header. */
  name?: string
  /** Accent color for buttons and highlights. */
  accent?: string
  /** Hide the "Made with Pitho" footer credit (white-label). */
  hideCredit?: boolean
  /** Short line under the title, e.g. "Prepared by Studio North". */
  note?: string
}

export interface SharePortal {
  /** Random id — the portal's public URL is /s/<id>. */
  id: string
  /** Hub this portal shares. */
  slug: string
  /** Internal label, e.g. "Client handoff". */
  name: string
  template: PortalTemplate
  /** Section ids to include; empty/undefined means all of them. */
  sections?: string[]
  password?: string | null
  expiresAt?: string | null
  /** Viewers can download files. */
  allowDownload: boolean
  branding?: PortalBranding
  createdAt: string
}

export interface BrandConfig {
  /** URL slug the hub lives at, e.g. "pitho" → /pitho */
  slug: string
  name: string
  tagline: string
  logoUrl?: string
  faviconUrl?: string
  website?: string
  colors: ColorGroup[]
  gradients?: GradientGroup[]
  typography: TypographyGroup[]
  sections: SectionConfig[]
  assets: {
    [key: string]: AssetFile[]
  }
  guidelines: {
    voice?: {
      title: string
      description: string
      principles: GuidelinePrinciple[]
    }
    usage?: {
      dos: string[]
      donts: string[]
    }
  }
  agent: AgentConfig
  /** Bytes this hub may store, when it differs from the plan default. */
  quotaBytes?: number
  /**
   * Prose for `doc` sections, keyed by section id.
   *
   * Keyed, unlike `guidelines`, which is one object shared by the whole hub —
   * five sections of that type would all render the same words.
   */
  docs?: { [sectionId: string]: { body: string } }
  updatedAt?: string
}
