'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const steps = [
    'Fetching your website…',
    'Reading brand colours…',
    'Detecting typography…',
    'Building your portal preview…',
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError('')

    for (let i = 0; i < steps.length - 1; i++) {
      setLoadingStep(steps[i])
      await new Promise(r => setTimeout(r, 900))
    }
    setLoadingStep(steps[steps.length - 1])

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      if (!res.ok) throw new Error('Scan failed')
      const data = await res.json()
      const params = new URLSearchParams({
        brandName: data.brandName,
        primaryColor: data.primaryColor,
        backgroundColor: data.backgroundColor,
        fontFamily: data.fontFamily,
        tagline: data.tagline,
        faviconUrl: data.faviconUrl || '',
        originalUrl: url.trim(),
      })
      router.push(`/preview?${params.toString()}`)
    } catch {
      setError("We couldn't read that URL. Try another, or check it's publicly accessible.")
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9f8] flex flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center animate-spin" style={{animationDuration:'3s'}}>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-[15px] font-semibold text-[#1a1a1a] mb-1">{loadingStep}</p>
            <p className="text-[13px] text-[#8a8a85]">This takes about 5 seconds</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9f9f8] flex flex-col">
      <nav className="border-b border-[#e8e7e4] bg-white px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-black rounded-md" />
          <span className="text-[15px] font-semibold tracking-tight">Brand Portal</span>
        </div>
        <a href="/admin" className="text-[13px] text-[#8a8a85] hover:text-black transition-colors">Sign in</a>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-[560px] w-full text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-[#e8e7e4] rounded-full px-4 py-1.5 mb-8 text-[12px] font-medium text-[#8a8a85]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            No signup required to see your preview
          </div>

          <h1 className="text-[42px] font-bold tracking-tight leading-[1.1] text-[#1a1a1a] mb-4">
            Your brand portal,<br />
            <span className="text-[#8a8a85]">in 30 seconds.</span>
          </h1>

          <p className="text-[17px] text-[#6b6b66] leading-relaxed mb-10 max-w-[420px] mx-auto">
            Enter your website and we'll build a preview instantly — styled with your brand, ready to fill with assets.
          </p>

          <form onSubmit={handleSubmit} className="flex gap-2 max-w-[480px] mx-auto mb-4">
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://yourcompany.com"
              required
              className="flex-1 px-4 py-3 rounded-xl border-[1.5px] border-[#e8e7e4] bg-white text-[15px] outline-none focus:border-black transition-colors placeholder:text-[#b0afa9]"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-black text-white text-[14px] font-semibold rounded-xl hover:bg-[#333] transition-colors whitespace-nowrap"
            >
              See your portal →
            </button>
          </form>

          {error && <p className="text-[13px] text-red-500 mb-4">{error}</p>}

          <p className="text-[12px] text-[#b0afa9]">
            Try it with{' '}
            <button onClick={() => setUrl('https://stripe.com')} className="underline hover:text-black transition-colors">stripe.com</button>,{' '}
            <button onClick={() => setUrl('https://linear.app')} className="underline hover:text-black transition-colors">linear.app</button>, or your own site
          </p>
        </div>

        <div className="mt-20 max-w-[640px] w-full">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[#b0afa9] text-center mb-8">How it works</p>
          <div className="grid grid-cols-3 gap-6">
            {[
              { n: '01', title: 'Enter your URL', desc: 'We read your site — colours, fonts, brand signals — automatically.' },
              { n: '02', title: 'See your portal', desc: 'A preview appears styled with your brand. No assets uploaded yet.' },
              { n: '03', title: 'Upload and share', desc: 'Add assets, set a PIN, share one link with your team or agency.' },
            ].map(step => (
              <div key={step.n} className="bg-white rounded-xl border border-[#e8e7e4] p-5">
                <p className="text-[11px] font-bold text-[#b0afa9] mb-3">{step.n}</p>
                <p className="text-[14px] font-semibold text-[#1a1a1a] mb-1.5">{step.title}</p>
                <p className="text-[13px] text-[#8a8a85] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
