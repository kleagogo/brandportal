/**
 * Validation for share-portal payloads — shared by the create and update
 * routes so a portal can never be saved with a template or password the
 * viewer side doesn't understand.
 */

import type { PortalBranding, PortalTemplate, SharePortal } from '@/app/types/brand'

const TEMPLATES: PortalTemplate[] = ['full', 'gallery', 'minimal']

type PortalPatch = Partial<Pick<SharePortal, 'name' | 'template' | 'sections' | 'password' | 'expiresAt' | 'allowDownload' | 'branding'>>

export function normalizePortalInput(body: Record<string, unknown>): { value: PortalPatch } | { error: string } {
  const value: PortalPatch = {}

  if (body.name !== undefined) value.name = String(body.name).slice(0, 60)

  if (body.template !== undefined) {
    const template = String(body.template) as PortalTemplate
    if (!TEMPLATES.includes(template)) return { error: 'Pick one of the available templates' }
    value.template = template
  }

  if (body.sections !== undefined) {
    if (!Array.isArray(body.sections)) return { error: 'Sections must be a list' }
    value.sections = body.sections.map(String).slice(0, 50)
  }

  if (body.password !== undefined) {
    const password = body.password === null ? null : String(body.password).trim()
    if (password !== null && password.length > 0 && password.length < 4) {
      return { error: 'Use at least 4 characters' }
    }
    value.password = password ? password.slice(0, 64) : null
  }

  if (body.expiresAt !== undefined) {
    const expiresAt = body.expiresAt === null || body.expiresAt === '' ? null : String(body.expiresAt)
    if (expiresAt !== null && Number.isNaN(new Date(expiresAt).getTime())) {
      return { error: 'That date isn’t valid' }
    }
    value.expiresAt = expiresAt
  }

  if (body.allowDownload !== undefined) value.allowDownload = Boolean(body.allowDownload)

  if (body.branding !== undefined) {
    if (body.branding === null) {
      value.branding = undefined
    } else if (typeof body.branding !== 'object') {
      return { error: 'Branding must be an object' }
    } else {
      const raw = body.branding as Record<string, unknown>
      const branding: PortalBranding = {}
      if (raw.logoUrl !== undefined) branding.logoUrl = String(raw.logoUrl).slice(0, 500)
      if (raw.name !== undefined) branding.name = String(raw.name).slice(0, 60)
      if (raw.note !== undefined) branding.note = String(raw.note).slice(0, 140)
      if (raw.hideCredit !== undefined) branding.hideCredit = Boolean(raw.hideCredit)
      if (raw.accent !== undefined) {
        const accent = String(raw.accent).trim()
        if (accent && !/^#[0-9a-fA-F]{3,8}$/.test(accent)) return { error: 'Accent must be a hex color' }
        branding.accent = accent || undefined
      }
      value.branding = branding
    }
  }

  return { value }
}
