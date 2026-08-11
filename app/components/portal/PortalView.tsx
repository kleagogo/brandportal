'use client'

import { useMemo, useState } from 'react'
import type { BrandConfig, SectionConfig, SharePortal } from '@/app/types/brand'
import { HubProvider, useHub } from '../hub/HubContext'
import { Icon } from '../hub/Icon'
import { ColorsSection } from '../hub/ColorsSection'
import { TypographySection } from '../hub/TypographySection'
import { AssetsSection } from '../hub/AssetsSection'
import { GuidelinesSection } from '../hub/GuidelinesSection'

/**
 * The read-only view a client sees at /s/<id>.
 *
 * Three templates share the same section components as the hub itself:
 *   full    — the hub layout, sidebar and all
 *   gallery — everything on one scrolling page
 *   minimal — a download list, nothing else
 * White-label branding replaces the logo, name, and accent, and can drop the
 * Basel credit entirely.
 */
export function PortalView({ config, portal }: { config: BrandConfig; portal: SharePortal }) {
  const branding = portal.branding || {}
  const accent = branding.accent
  const style = accent
    ? ({ '--hub-btn': accent, '--hub-btn-text': readableOn(accent) } as React.CSSProperties)
    : undefined

  const fontUrls = useMemo(() => {
    const urls = new Set<string>()
    for (const group of config.typography) {
      for (const font of group.fonts) if (font.importUrl) urls.add(font.importUrl)
    }
    return [...urls]
  }, [config.typography])

  return (
    <HubProvider initial={config} allowDownload={portal.allowDownload}>
      <div className="hub-light min-h-screen bg-[var(--hub-bg)] text-[var(--hub-text)] flex flex-col" style={style}>
        {fontUrls.map(url => <link key={url} rel="stylesheet" href={url} />)}
        {portal.template === 'full'
          ? <FullTemplate config={config} portal={portal} />
          : portal.template === 'gallery'
            ? <GalleryTemplate config={config} portal={portal} />
            : <MinimalTemplate config={config} portal={portal} />}
        {!branding.hideCredit && (
          <footer className="border-t border-[var(--hub-border)] py-5 text-center">
            <a href="/" className="text-[11px] text-[var(--hub-faint)] hover:text-[var(--hub-text)] transition-colors">
              Made with Basel
            </a>
          </footer>
        )}
      </div>
    </HubProvider>
  )
}

// ─── Shared pieces ────────────────────────────────────────────────────────────

function Identity({ config, portal, size = 'md' }: { config: BrandConfig; portal: SharePortal; size?: 'sm' | 'md' }) {
  const branding = portal.branding || {}
  const logo = branding.logoUrl || config.logoUrl
  const name = branding.name || config.name
  const box = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11'
  return (
    <div className="flex items-center gap-3 min-w-0">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={name} className={`${box} object-contain shrink-0`} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
      ) : (
        <div className={`${box} bg-[var(--hub-text)] rounded-xl shrink-0`} />
      )}
      <div className="min-w-0">
        <p className={`${size === 'sm' ? 'text-[13px]' : 'text-[15px]'} font-semibold leading-tight truncate`}>{name}</p>
        <p className="text-[11px] text-[var(--hub-faint)] leading-tight truncate">{branding.note || config.tagline}</p>
      </div>
    </div>
  )
}

function SectionBody({ section }: { section: SectionConfig }) {
  switch (section.type) {
    case 'colors':     return <ColorsSection />
    case 'typography': return <TypographySection />
    case 'guidelines': return <GuidelinesSection />
    case 'home':
    case 'subbrand':
    case 'link':       return null
    default:           return <AssetsSection sectionId={section.id} />
  }
}

/** Sections a portal actually renders — links and placeholders are dropped. */
function visibleSections(config: BrandConfig): SectionConfig[] {
  return config.sections.filter(s => s.type !== 'link' && s.type !== 'home' && s.type !== 'subbrand')
}

// ─── Full: the hub layout ─────────────────────────────────────────────────────

function FullTemplate({ config, portal }: { config: BrandConfig; portal: SharePortal }) {
  const sections = visibleSections(config)
  const [active, setActive] = useState(sections[0]?.id || '')
  const [navOpen, setNavOpen] = useState(false)
  const section = sections.find(s => s.id === active) || sections[0]

  return (
    <div className="flex-1 flex">
      {navOpen && <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setNavOpen(false)} />}

      <aside className={`w-60 shrink-0 border-r border-[var(--hub-border)] bg-[var(--hub-panel)] flex flex-col h-screen z-40 transition-transform
        fixed inset-y-0 left-0 ${navOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:sticky md:top-0`}>
        <div className="px-4 py-4 border-b border-[var(--hub-border)]">
          <Identity config={config} portal={portal} size="sm" />
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => { setActive(s.id); setNavOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[13px] transition-colors text-left ${
                s.id === section?.id
                  ? 'bg-[var(--hub-soft)] text-[var(--hub-text)] font-medium'
                  : 'text-[var(--hub-muted)] hover:text-[var(--hub-text)] hover:bg-[var(--hub-soft)]'
              }`}
            >
              <Icon name={s.icon} size={14} /> {s.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 bg-[var(--hub-panel)] border-b border-[var(--hub-border)] flex items-center gap-3 px-4 sm:px-6 sticky top-0 z-20">
          <button onClick={() => setNavOpen(o => !o)} className="md:hidden text-[var(--hub-muted)] hover:text-[var(--hub-text)] transition-colors" title="Menu">
            <Icon name="menu" size={18} />
          </button>
          <p className="text-[13px] font-medium text-[var(--hub-muted)] truncate">{section?.label}</p>
          <span className="ml-auto text-[11px] font-semibold uppercase tracking-wider text-[var(--hub-faint)]">Shared with you</span>
        </header>
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8">
            {section && <SectionBody section={section} />}
          </div>
        </main>
      </div>
    </div>
  )
}

// ─── Gallery: one scrolling page ──────────────────────────────────────────────

function GalleryTemplate({ config, portal }: { config: BrandConfig; portal: SharePortal }) {
  const sections = visibleSections(config)
  return (
    <div className="flex-1">
      <header className="bg-[var(--hub-panel)] border-b border-[var(--hub-border)] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-3 flex items-center gap-5">
          <Identity config={config} portal={portal} size="sm" />
          <nav className="ml-auto hidden sm:flex items-center gap-4 overflow-x-auto">
            {sections.map(s => (
              <a key={s.id} href={`#${s.id}`} className="text-[12.5px] text-[var(--hub-muted)] hover:text-[var(--hub-text)] transition-colors whitespace-nowrap">
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12">
        <h1 className="text-[32px] sm:text-[40px] font-bold tracking-tight leading-[1.05] mb-2">
          {portal.branding?.name || config.name}
        </h1>
        <p className="text-[15px] text-[var(--hub-muted)] max-w-lg">
          {portal.branding?.note || config.tagline}
        </p>
      </div>

      {sections.map((s, i) => (
        <section key={s.id} id={s.id} className={`border-t border-[var(--hub-border)] ${i % 2 ? 'bg-[var(--hub-panel)]' : ''}`}>
          <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12">
            <SectionBody section={s} />
          </div>
        </section>
      ))}
    </div>
  )
}

// ─── Minimal: downloads only ──────────────────────────────────────────────────

function MinimalTemplate({ config, portal }: { config: BrandConfig; portal: SharePortal }) {
  const { allowDownload } = useHub()
  const sections = visibleSections(config).filter(s => (config.assets[s.id] || []).length > 0)

  return (
    <div className="flex-1 max-w-2xl w-full mx-auto px-5 sm:px-8 py-14">
      <Identity config={config} portal={portal} />
      <h1 className="text-[26px] font-bold tracking-tight mt-8 mb-1">Brand files</h1>
      <p className="text-[14px] text-[var(--hub-muted)] mb-10">
        {allowDownload ? 'Everything you need, ready to download.' : 'A read-only list of the shared files.'}
      </p>

      {sections.length === 0 && (
        <p className="text-[13px] text-[var(--hub-faint)]">No files have been shared here yet.</p>
      )}

      {sections.map(section => {
        const assets = config.assets[section.id] || []
        const hasLocalFiles = assets.some(a => a.file.startsWith('/'))
        return (
          <div key={section.id} className="mb-10">
            <div className="flex items-center justify-between gap-4 mb-3">
              <h2 className="text-[13px] font-semibold uppercase tracking-widest text-[var(--hub-faint)]">{section.label}</h2>
              {allowDownload && hasLocalFiles && (
                <a
                  href={`/api/hubs/${encodeURIComponent(config.slug)}/pack?section=${encodeURIComponent(section.id)}`}
                  className="text-[12px] font-semibold text-[var(--hub-text)] underline underline-offset-2 whitespace-nowrap"
                >
                  Download all
                </a>
              )}
            </div>
            <div className="border border-[var(--hub-border)] rounded-2xl overflow-hidden bg-[var(--hub-panel)]">
              {assets.map((asset, i) => (
                <div key={`${asset.name}-${i}`} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 border-[var(--hub-border)]">
                  <div className="w-9 h-9 rounded-lg bg-[var(--hub-tile)] border border-[var(--hub-border)] flex items-center justify-center overflow-hidden shrink-0">
                    {/^.+\.(svg|png|jpe?g|webp|gif)(\?|$)/i.test(asset.file) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={asset.file} alt={asset.name} className="max-h-full max-w-full object-contain p-1" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <Icon name="file" size={15} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium truncate">{asset.name}</p>
                    <p className="text-[11px] text-[var(--hub-faint)] truncate">
                      {[asset.approvedVersion, ...asset.format].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {allowDownload && (
                    <a
                      href={asset.file.startsWith('/api/files/') ? `${asset.file}?dl=1` : asset.file}
                      {...(asset.external || asset.file.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : { download: true })}
                      className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-[var(--hub-btn)] text-[var(--hub-btn-text)] hover:opacity-85 transition-colors whitespace-nowrap shrink-0"
                    >
                      {asset.external ? 'Open' : 'Download'}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Black or white text, whichever stays readable on the accent color. */
function readableOn(hex: string): string {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.split('').map(c => c + c).join('') : value.slice(0, 6)
  const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) || 0)
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#1a1a1a' : '#ffffff'
}
