'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const placeholders = [
  { icon: '🖼', title: 'Primary logo', tags: ['logo', 'svg'] },
  { icon: '🖼', title: 'Logo — light version', tags: ['logo', 'svg'] },
  { icon: '🎨', title: 'Colour palette', tags: ['color', 'pdf'] },
  { icon: '✍️', title: 'Typography guide', tags: ['type', 'pdf'] },
  { icon: '📐', title: 'Icon set', tags: ['icons', 'svg'] },
  { icon: '📄', title: 'Brand guidelines', tags: ['guidelines', 'pdf'] },
]

function lightenColor(hex: string, amount: number): string {
  try {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, (num >> 16) + amount)
    const g = Math.min(255, ((num >> 8) & 0xff) + amount)
    const b = Math.min(255, (num & 0xff) + amount)
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
  } catch { return '#f0efec' }
}

function PreviewContent() {
  const params = useSearchParams()
  const brandName = params.get('brandName') || 'Your Brand'
  const primaryColor = params.get('primaryColor') || '#1a1a1a'
  const fontFamily = params.get('fontFamily') || 'Inter'
  const tagline = params.get('tagline') || 'Your brand assets, all in one place.'
  const faviconUrl = params.get('faviconUrl') || ''
  const originalUrl = params.get('originalUrl') || ''

  const accentLight = lightenColor(primaryColor, 180)

  return (
    <div className="min-h-screen bg-[#f9f9f8]" style={{ fontFamily: `'${fontFamily}', -apple-system, sans-serif` }}>

      {/* Top banner */}
      <div className="bg-[#1a1a1a] text-white text-center py-2.5 px-4 text-[12px] font-medium flex items-center justify-center gap-3">
        <span>✦ This is a preview — claim your portal to start uploading assets</span>
        <a href="/signup" className="underline opacity-80 hover:opacity-100">Claim it free →</a>
      </div>

      {/* Portal header */}
      <header className="bg-white border-b border-[#e8e7e4] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {faviconUrl ? (
              <img src={faviconUrl} alt="" className="w-7 h-7 rounded-md object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ) : (
              <div className="w-7 h-7 rounded-md" style={{ background: primaryColor }} />
            )}
            <span className="text-[15px] font-semibold">{brandName}</span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#f0efec] text-[#8a8a85]">Brand</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#8a8a85] bg-[#f5f5f3] px-3 py-1.5 rounded-lg border border-[#e8e7e4]">
              🔒 Preview mode
            </span>
          </div>
        </div>
      </header>

      {/* Portal content */}
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-[22px] font-bold tracking-tight mb-1" style={{ color: primaryColor === '#ffffff' ? '#1a1a1a' : primaryColor }}>
            {brandName} Brand Assets
          </h1>
          <p className="text-[14px] text-[#8a8a85] max-w-[500px] leading-relaxed">
            {tagline || `Everything you need to represent ${brandName} — logos, colours, type, and guidelines.`}
          </p>
        </div>

        {/* Search bar (decorative in preview) */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 max-w-xs flex items-center gap-2 bg-white border-[1.5px] border-[#e8e7e4] rounded-lg px-3 py-2">
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.35 10.057C8.58 10.649 7.58 11 6.5 11C4.015 11 2 8.985 2 6.5C2 4.015 4.015 2 6.5 2C8.985 2 11 4.015 11 6.5C11 7.58 10.649 8.58 10.057 9.35L12.854 12.146L12.146 12.854L9.35 10.057Z" fill="#b0afa9" fillRule="evenodd" clipRule="evenodd"/></svg>
            <span className="text-[13px] text-[#b0afa9]">Search assets…</span>
          </div>
          {['All', 'Logos', 'Colours', 'Type', 'Guidelines'].map(f => (
            <button
              key={f}
              className="text-[12px] font-medium px-3 py-1.5 rounded-full border-[1.5px] transition-colors"
              style={f === 'All' ? { background: primaryColor, borderColor: primaryColor, color: '#fff' } : { borderColor: '#e8e7e4', background: '#fff', color: '#8a8a85' }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Asset grid — placeholders */}
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#b0afa9] mb-4">Assets</p>
        <div className="grid grid-cols-3 gap-4 mb-10">
          {placeholders.map((item, i) => (
            <div
              key={i}
              className="bg-white border-[1.5px] border-[#e8e7e4] rounded-xl overflow-hidden group relative"
            >
              {/* Placeholder badge */}
              <div className="absolute top-2.5 right-2.5 z-10">
                <span className="text-[10px] font-semibold bg-[#f0efec] text-[#b0afa9] px-2 py-0.5 rounded-full">placeholder</span>
              </div>

              {/* Preview area */}
              <div className="h-32 flex items-center justify-center text-3xl border-b border-[#e8e7e4]"
                style={{ background: accentLight }}>
                {item.icon}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-[13px] font-medium text-[#1a1a1a] mb-2">{item.title}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {item.tags.map(t => (
                      <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-[#f0efec] text-[#8a8a85]">{t}</span>
                    ))}
                  </div>
                  {/* Locked download button */}
                  <div className="w-7 h-7 rounded-md border border-[#e8e7e4] flex items-center justify-center opacity-40">
                    <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M7.5 2v8M4.5 7.5l3 3 3-3M2 11.5h11" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Claim CTA */}
        <div className="rounded-2xl border-[1.5px] p-8 text-center" style={{ borderColor: primaryColor + '40', background: accentLight }}>
          <div className="w-10 h-10 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: primaryColor }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h2 className="text-[18px] font-bold tracking-tight mb-2">Claim your {brandName} brand portal</h2>
          <p className="text-[14px] text-[#6b6b66] mb-6 max-w-sm mx-auto">
            Sign up to start uploading real assets. Your portal will live at <strong>{originalUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}/brand</strong>
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href="/signup"
              className="px-6 py-2.5 text-[14px] font-semibold rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ background: primaryColor }}
            >
              Claim your portal — it's free
            </a>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2.5 text-[14px] font-medium rounded-xl bg-white border border-[#e8e7e4] text-[#8a8a85] hover:text-black transition-colors"
            >
              Try a different URL
            </button>
          </div>
          <p className="text-[12px] text-[#b0afa9] mt-4">No credit card required · €18/month after trial</p>
        </div>
      </div>
    </div>
  )
}

export default function PreviewPage() {
  return (
    <Suspense>
      <PreviewContent />
    </Suspense>
  )
}
