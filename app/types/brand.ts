export interface ColorSwatch {
  name: string
  hex: string
  usage?: string
}

export interface ColorGroup {
  group: string
  swatches: ColorSwatch[]
}

export interface TypeSpecimen {
  label: string
  size: string
  weight: string
  sample: string
}

export interface FontConfig {
  name: string
  role: string
  weights: string[]
  usage: string
  importUrl?: string
  specimens: TypeSpecimen[]
}

export interface TypographyGroup {
  group: string
  fonts: FontConfig[]
}

export type SectionType = 'assets' | 'colors' | 'typography' | 'guidelines' | 'link' | 'tokens'
export type SectionIcon = 'logo' | 'colors' | 'type' | 'screenshots' | 'guidelines' | 'link'

export interface SectionConfig {
  id: string
  label: string
  type: SectionType
  icon: SectionIcon
  url?: string // for type: 'link'
}

export interface AssetFile {
  name: string
  file: string
  format: string[]
  usage?: string
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
}

export interface BrandConfig {
  name: string
  tagline: string
  logoUrl?: string
  faviconUrl?: string
  website?: string
  colors: ColorGroup[]
  typography: TypographyGroup[]
  sections: SectionConfig[]
  assets: {
    logo: AssetFile[]
    screenshots: AssetFile[]
    guidelines: AssetFile[]
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
}
