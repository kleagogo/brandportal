'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SCAN_STEPS = [
  'Reading your website…',
  'Found your logo',
  'Found your colors',
  'Detected typography',
  'Reading tone of voice…',
  'Building your hub',
]

export default function LandingPage() {
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState('')
  const router = useRouter()

  // Arriving from an expired preview link.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('expired')) {
      setError('That preview expired — scan your site again to get a fresh one.')
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || scanning) return
    setScanning(true)
    setError('')
    setStepIndex(0)

    // Stream the checklist while the real scan runs.
    const ticker = setInterval(() => {
      setStepIndex(i => Math.min(i + 1, SCAN_STEPS.length - 1))
    }, 850)

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      if (!res.ok) throw new Error('Scan failed')
      const data = await res.json()
      clearInterval(ticker)
      router.push(`/preview/${data.previewId}`)
    } catch {
      clearInterval(ticker)
      setError("We couldn't read that URL. Try another, or check it's publicly accessible.")
      setScanning(false)
    }
  }

  if (scanning) {
    return (
      <div className="min-h-screen bg-[#f9f9f8] flex items-center justify-center px-6">
        <div className="w-full max-w-[340px]">
          <div className="w-12 h-12 rounded-full border-2 border-[#e8e7e4] border-t-[#1a1a1a] animate-spin mx-auto mb-8" />
          <div className="space-y-2.5">
            {SCAN_STEPS.map((step, i) => (
              <div
                key={step}
                className={`flex items-center gap-2.5 text-[13.5px] transition-all duration-300 ${
                  i < stepIndex ? 'text-emerald-600' : i === stepIndex ? 'text-[#1a1a1a] font-medium' : 'text-[#c4c2bb]'
                }`}
              >
                {i < stepIndex ? (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : i === stepIndex ? (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-[#1a1a1a] border-t-transparent animate-spin inline-block" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-[#e0dfda] inline-block" />
                )}
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9f9f8] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-[#e8e7e4] bg-white/80 backdrop-blur px-5 sm:px-8 h-14 flex items-center justify-between sticky top-0 z-30">
        <a href="#" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#1a1a1a] rounded-md flex items-center justify-center">
            <div className="w-3 h-3 rounded-sm border-[1.5px] border-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Brand Portal</span>
        </a>
        <div className="flex items-center gap-5">
          <Link href="/meridian" className="text-[13px] text-[#8a8a85] hover:text-[#1a1a1a] transition-colors hidden sm:block">Example hub</Link>
          <a href="#pricing" className="text-[13px] text-[#8a8a85] hover:text-[#1a1a1a] transition-colors">Pricing</a>
          <a href="#scan" className="text-[13px] font-semibold bg-[#1a1a1a] text-white px-3.5 py-1.5 rounded-lg hover:bg-[#333] transition-colors">Get started</a>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section id="scan" className="px-6 pt-20 pb-16 sm:pt-28">
          <div className="max-w-[600px] mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white border border-[#e8e7e4] rounded-full px-4 py-1.5 mb-8 text-[12px] font-medium text-[#8a8a85]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Free — no signup to see your hub
            </div>

            <h1 className="text-[38px] sm:text-[46px] font-bold tracking-tight leading-[1.08] text-[#1a1a1a] mb-5 text-balance">
              Your brand, alive at one link.
            </h1>

            <p className="text-[16px] sm:text-[17px] text-[#6b6b66] leading-relaxed mb-10 max-w-[460px] mx-auto">
              Paste your website. We read your logo, colors, and type, and build a living brand hub you can edit in place and share with anyone.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-[480px] mx-auto mb-4">
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="yourcompany.com"
                required
                className="flex-1 px-4 py-3 rounded-xl border-[1.5px] border-[#e8e7e4] bg-white text-[15px] outline-none focus:border-[#1a1a1a] transition-colors placeholder:text-[#b0afa9]"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-[#1a1a1a] text-white text-[14px] font-semibold rounded-xl hover:bg-[#333] transition-colors whitespace-nowrap"
              >
                Scan my brand →
              </button>
            </form>

            {error && <p className="text-[13px] text-red-500 mb-4">{error}</p>}

            <p className="text-[12px] text-[#b0afa9]">
              Try{' '}
              <button onClick={() => setUrl('stripe.com')} className="underline underline-offset-2 hover:text-[#1a1a1a] transition-colors">stripe.com</button>,{' '}
              <button onClick={() => setUrl('linear.app')} className="underline underline-offset-2 hover:text-[#1a1a1a] transition-colors">linear.app</button>, or your own site — or{' '}
              <Link href="/meridian" className="underline underline-offset-2 hover:text-[#1a1a1a] transition-colors">browse a finished hub</Link>
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 pb-20">
          <div className="max-w-[720px] mx-auto">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-[#b0afa9] text-center mb-8">How it works</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { n: '01', title: 'Scan', desc: 'Paste your URL. We read your site — logo, colors, fonts, voice — and build the hub for you.' },
                { n: '02', title: 'Edit in place', desc: 'The hub is the editor. Click a swatch to change it, drop files where they belong, done.' },
                { n: '03', title: 'Share one link', desc: 'Send the link to your team, agency, or press. They browse and download — no accounts.' },
              ].map(step => (
                <div key={step.n} className="bg-white rounded-2xl border border-[#e8e7e4] p-5">
                  <p className="text-[11px] font-bold text-[#b0afa9] mb-3">{step.n}</p>
                  <p className="text-[14px] font-semibold text-[#1a1a1a] mb-1.5">{step.title}</p>
                  <p className="text-[13px] text-[#8a8a85] leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Example hub */}
        <section className="px-6 pb-24">
          <div className="max-w-[720px] mx-auto">
            <Link
              href="/meridian"
              className="block bg-white border border-[#e8e7e4] rounded-2xl p-6 sm:p-8 hover:border-[#1a1a1a] transition-colors group"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/meridian-mark.svg" alt="Meridian" className="w-12 h-12" />
                  <div>
                    <p className="text-[16px] font-semibold text-[#1a1a1a]">See a finished hub — Meridian</p>
                    <p className="text-[13px] text-[#8a8a85]">A complete brand hub: colors, type, logo files, guidelines. This is what you get.</p>
                  </div>
                </div>
                <span className="text-[13px] font-semibold text-[#8a8a85] group-hover:text-[#1a1a1a] transition-colors whitespace-nowrap">Open the hub →</span>
              </div>
              <div className="mt-6 flex gap-2">
                {['#1F3B2C', '#3C5A48', '#D8E2DC', '#D96E30', '#F7E1D3', '#EDE7DC', '#23211C'].map(hex => (
                  <div key={hex} className="h-9 flex-1 rounded-lg border border-black/5" style={{ background: hex }} />
                ))}
              </div>
            </Link>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="px-6 pb-24">
          <div className="max-w-[720px] mx-auto">
            <h2 className="text-[26px] font-bold tracking-tight text-center text-[#1a1a1a] mb-2">Simple pricing</h2>
            <p className="text-[14px] text-[#8a8a85] text-center mb-10 max-w-[400px] mx-auto">
              You never pay to keep something — only to get more. Viewing and editing your hub is free, forever.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[600px] mx-auto">
              <div className="bg-white border border-[#e8e7e4] rounded-2xl p-6">
                <p className="text-[14px] font-semibold text-[#1a1a1a] mb-1">Free</p>
                <p className="text-[30px] font-bold tracking-tight text-[#1a1a1a] mb-4">€0</p>
                <ul className="space-y-2.5 mb-6">
                  {['1 brand hub, yours forever', 'Full editing & uploads', 'Share link — viewers need no account', 'PIN protection (coming soon)'].map(f => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-[#6b6b66]">
                      <svg className="mt-0.5 shrink-0 text-emerald-500" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#scan" className="block text-center text-[13px] font-semibold bg-[#1a1a1a] text-white px-4 py-2.5 rounded-xl hover:bg-[#333] transition-colors">
                  Start free
                </a>
              </div>

              <div className="bg-white border-[1.5px] border-[#1a1a1a] rounded-2xl p-6 relative">
                <span className="absolute -top-2.5 left-6 text-[10px] font-bold uppercase tracking-wider bg-[#1a1a1a] text-white px-2 py-0.5 rounded-full">Coming soon</span>
                <p className="text-[14px] font-semibold text-[#1a1a1a] mb-1">Pro</p>
                <p className="text-[30px] font-bold tracking-tight text-[#1a1a1a] mb-4">€12<span className="text-[14px] font-medium text-[#8a8a85]">/month</span></p>
                <ul className="space-y-2.5 mb-6">
                  {['Everything in Free', 'Custom domain — brand.you.com', 'Export & self-host your hub', 'Up to 3 hubs · 10 editors'].map(f => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-[#6b6b66]">
                      <svg className="mt-0.5 shrink-0 text-emerald-500" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#scan" className="block text-center text-[13px] font-semibold border-[1.5px] border-[#1a1a1a] text-[#1a1a1a] px-4 py-2.5 rounded-xl hover:bg-[#1a1a1a] hover:text-white transition-colors">
                  Start free, upgrade later
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e8e7e4] bg-white px-6 py-8">
        <div className="max-w-[720px] mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#1a1a1a] rounded flex items-center justify-center">
              <div className="w-2 h-2 rounded-[2px] border border-white" />
            </div>
            <span className="text-[13px] font-semibold text-[#1a1a1a]">Brand Portal</span>
          </div>
          <p className="text-[12px] text-[#b0afa9]">One source of truth for your brand — editable in place, shareable with one link.</p>
        </div>
      </footer>
    </div>
  )
}
