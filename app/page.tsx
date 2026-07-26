'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Basel — brand asset management for agencies ──────────────────────────────
// The marketing site, styled in the product hub's design system (warm-neutral,
// Inter, rounded, soft borders). Product lives at /login and /meridian.

const CLIENT_SPACES = [
  { name: 'Copperline Coffee', letter: 'C', color: '#A5502A' },
  { name: 'Northtrail', letter: 'N', color: '#1E5A42' },
  { name: 'Paloma Hotels', letter: 'P', color: '#6C4A8C' },
]

const PROBLEMS = [
  { file: 'final-final-v2.svg', title: 'Four versions of the logo. Six folders.', body: 'Drive, Dropbox, Slack, email, Figma — and nobody’s sure which mark the client actually approved.' },
  { file: '~40 min / search', title: 'Every handoff starts with archaeology.', body: 'New designer, new dev, client request — cue the dig through five tools and three inboxes.' },
  { file: 'guidelines_FINAL.pdf', title: 'Guidelines nobody opens.', body: 'The brand PDF went stale a week after the rebrand shipped. The old logo still makes appearances.' },
]

const FEATURES = [
  { tag: '0.4s', title: 'Instant search', body: 'Across names, tags, colors and clients. The approved file, first result, every time.' },
  { tag: 'AI', title: 'Auto-tagging on upload', body: 'Every file tagged, categorized and duplicate-checked on arrival. Zero manual filing.' },
  { tag: 'v4', title: 'Latest-approved versioning', body: 'One source of truth per asset. Devs, decks and vendors all pull the same file.' },
  { tag: '1-click', title: 'Client portals & approvals', body: 'Send a clean portal, not a zip. Clients approve in one click — no accounts to babysit.' },
  { tag: 'Spaces', title: 'Multi-client spaces', body: 'Every client gets a separate, branded home. Switch in a keystroke, keep permissions clean.' },
  { tag: 'Synced', title: 'Living guidelines', body: 'Guidelines that pull straight from the library. Update an asset once — never stale, never a PDF.' },
]

const INTEGRATIONS = [
  { name: 'Figma', body: 'Push finals straight from your files. Basel versions them and flags anything stale in the design file.' },
  { name: 'Slack', body: 'Search the library from any channel. Drop the approved file into the thread — not a guess from Drive.' },
  { name: 'Canva', body: 'Locked templates with the right logos, colors and type — safe for the non-designers on the client side.' },
  { name: 'Notion', body: 'Embed living guidelines and asset grids in your wiki. They update themselves when the library changes.' },
  { name: 'Google Drive', body: 'Point Basel at the mess once. It migrates, dedupes and tags everything — folders stay behind.' },
  { name: 'Adobe CC', body: 'Open assets in Illustrator, Photoshop and InDesign with version history intact — saves the round-trip back.' },
]

const PLANS = [
  {
    name: 'Free', monthly: '$0', annual: '$0', per: 'forever',
    who: 'For freelancers getting organized',
    features: ['2 client spaces', '5 GB storage', 'Unlimited seats', 'Search & version history'],
    cta: 'Start free →', popular: false,
  },
  {
    name: 'Studio', monthly: '$79', annual: '$63', per: '/mo',
    who: 'For agencies with a real roster',
    features: ['10 client spaces', '100 GB storage', 'Client portals & one-click approvals', 'AI auto-tagging & dedupe', 'Figma, Slack & Canva integrations'],
    cta: 'Start 14-day trial →', popular: true,
  },
  {
    name: 'Growth', monthly: '$199', annual: '$159', per: '/mo',
    who: 'For studios that keep growing',
    features: ['Unlimited client spaces', '1 TB storage', 'White-label client portals', 'Usage analytics per client', 'Priority migration — we move your mess'],
    cta: 'Start 14-day trial →', popular: false,
  },
]

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="w-7 h-7 rounded-md bg-[#1a1a1a] text-white flex items-center justify-center font-bold text-[14px]">B</span>
      <span className={`text-[16px] font-semibold tracking-tight ${light ? 'text-white' : 'text-[#1a1a1a]'}`}>Basel</span>
    </Link>
  )
}

export default function BaselLanding() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="min-h-screen bg-[#f9f9f8] text-[#1a1a1a]">
      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-[#e8e7e4]">
        <div className="max-w-[1120px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Wordmark />
            <div className="hidden md:flex items-center gap-6 text-[13.5px] text-[#8a8a85]">
              <a href="#product" className="hover:text-[#1a1a1a] transition-colors">Product</a>
              <a href="#integrations" className="hover:text-[#1a1a1a] transition-colors">Integrations</a>
              <a href="#pricing" className="hover:text-[#1a1a1a] transition-colors">Pricing</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/meridian" className="hidden sm:block text-[13.5px] text-[#8a8a85] hover:text-[#1a1a1a] transition-colors">Open the demo</Link>
            <Link href="/login" className="text-[13px] font-semibold px-3.5 py-1.5 rounded-lg bg-[#1a1a1a] text-white hover:bg-[#333] transition-colors">Start free</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <header className="max-w-[1120px] mx-auto px-6 pt-16 sm:pt-20 pb-16 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[#b0afa9] mb-5">Brand asset management for agencies</p>
          <h1 className="text-[clamp(34px,5vw,52px)] font-bold tracking-tight leading-[1.05] text-balance mb-5">
            Stop hunting for the latest logo.
          </h1>
          <p className="text-[16px] leading-relaxed text-[#6b6b66] max-w-[48ch] mb-8">
            Basel gives every client one clean brand hub — every asset, every version, findable in seconds. Live in ten minutes. No consultants, no enterprise bloat.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/login" className="text-[14px] font-semibold px-5 py-3 rounded-xl bg-[#1a1a1a] text-white hover:bg-[#333] transition-colors">
              Start free — no card required →
            </Link>
            <Link href="/meridian" className="text-[14px] font-semibold px-5 py-3 rounded-xl border border-[#e8e7e4] hover:border-[#1a1a1a] transition-colors">
              See it in action
            </Link>
          </div>
        </div>

        {/* Product mock — a client space with assets */}
        <div className="rounded-2xl border border-[#e8e7e4] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 h-10 border-b border-[#e8e7e4] bg-[#f9f9f8]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#dddcd6]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#dddcd6]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#dddcd6]" />
            <span className="ml-3 text-[11.5px] font-mono text-[#b0afa9]">app.basel.design</span>
          </div>
          <div className="flex">
            <div className="w-40 shrink-0 border-r border-[#e8e7e4] p-3 hidden sm:block">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-[#b0afa9] mb-2 px-1">Client spaces</p>
              {CLIENT_SPACES.map((c, i) => (
                <div key={c.name} className={`flex items-center gap-2 px-2 py-1.5 mb-0.5 rounded-lg ${i === 0 ? 'bg-[#f0efec]' : ''}`}>
                  <span className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: c.color }}>{c.letter}</span>
                  <span className="text-[11px] font-medium truncate">{c.name}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 p-4">
              <div className="flex items-center gap-2 mb-3 px-2.5 py-1.5 rounded-lg bg-[#f5f5f3]">
                <span className="text-[11px] font-mono text-[#b0afa9]">copperline wordmark dark</span>
                <span className="ml-auto text-[9px] font-semibold text-[#8a8a85]">1 match · 0.4s</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { t: 'Wordmark — Reversed', m: 'SVG · V4 · Latest', badge: 'Approved', dark: true },
                  { t: 'Wordmark — Primary', m: 'SVG · V4', dark: false },
                  { t: 'Palette — Core', m: 'ASE · V1', swatch: true },
                  { t: 'roastery-04.jpg', m: 'JPG · 4.2 MB', photo: true },
                ].map(a => (
                  <div key={a.t} className="rounded-lg border border-[#e8e7e4] overflow-hidden">
                    <div className="h-14 flex items-center justify-center" style={{ background: a.dark ? '#A5502A' : a.swatch ? '#f9f9f8' : a.photo ? '#c9b8a8' : '#f9f9f8' }}>
                      {a.swatch ? (
                        <div className="flex gap-1">
                          {['#A5502A', '#23150E', '#D9A441', '#F6EFE7'].map(s => <span key={s} className="w-4 h-4 rounded-sm border border-black/5" style={{ background: s }} />)}
                        </div>
                      ) : a.photo ? null : (
                        <span className="text-[11px] font-bold" style={{ color: a.dark ? '#F6EFE7' : '#A5502A' }}>Copperline</span>
                      )}
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="text-[10px] font-semibold truncate flex items-center gap-1">{a.t}{a.badge && <span className="text-[8px] px-1 rounded text-white" style={{ background: '#1E5A42' }}>{a.badge}</span>}</p>
                      <p className="text-[9px] font-mono text-[#b0afa9] truncate">{a.m}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Problem ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#1a1a1a] text-white py-20">
        <div className="max-w-[1120px] mx-auto px-6">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[#8a8a85] mb-4">Sound familiar?</p>
          <h2 className="text-[clamp(26px,4vw,40px)] font-bold tracking-tight leading-[1.08] max-w-[20ch] mb-12 text-balance">
            Your brand assets are everywhere. That’s the problem.
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {PROBLEMS.map(p => (
              <div key={p.file} className="rounded-2xl bg-white/[0.04] border border-white/10 p-6">
                <p className="inline-block text-[11px] font-mono px-2 py-1 mb-4 rounded-md bg-white/[0.06] text-white/80">{p.file}</p>
                <p className="text-[17px] font-semibold mb-2 leading-snug">{p.title}</p>
                <p className="text-[13.5px] leading-relaxed text-[#a6a5a1]">{p.body}</p>
              </div>
            ))}
          </div>
          <blockquote className="mt-12 border-l-2 border-white/25 pl-6">
            <p className="text-[clamp(20px,3vw,28px)] font-bold tracking-tight leading-snug max-w-[26ch]">“It isn’t a branding problem. It’s a systems problem.”</p>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-[#8a8a85] mt-3">— Every agency, eventually</p>
          </blockquote>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="product" className="max-w-[1120px] mx-auto px-6 py-20">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-[#b0afa9] mb-4">The hub</p>
        <h2 className="text-[clamp(26px,4vw,40px)] font-bold tracking-tight leading-[1.08] max-w-[18ch] mb-12 text-balance">
          One place. Every client. Under ten seconds.
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="rounded-2xl bg-white border border-[#e8e7e4] p-6 hover:border-[#1a1a1a] transition-colors">
              <span className="inline-block text-[11px] font-semibold px-2 py-0.5 mb-4 rounded-md bg-[#f0efec] text-[#8a8a85]">{f.tag}</span>
              <p className="text-[16px] font-semibold mb-2">{f.title}</p>
              <p className="text-[13.5px] leading-relaxed text-[#6b6b66]">{f.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/meridian" className="text-[14px] font-semibold text-[#1a1a1a] underline underline-offset-4 decoration-[#dddcd6] hover:decoration-[#1a1a1a] transition-colors">
            Click around the live product demo →
          </Link>
        </div>
      </section>

      {/* ── Integrations ────────────────────────────────────────────────────── */}
      <section id="integrations" className="bg-white py-20 border-y border-[#e8e7e4]">
        <div className="max-w-[1120px] mx-auto px-6">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[#b0afa9] mb-4">Integrations</p>
          <h2 className="text-[clamp(26px,4vw,40px)] font-bold tracking-tight leading-[1.08] max-w-[16ch] mb-4 text-balance">
            Meets your stack where it already works.
          </h2>
          <p className="text-[15px] text-[#6b6b66] max-w-[56ch] mb-12">
            Basel is the source of truth — your tools pull from it, so the right asset shows up where the work happens.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTEGRATIONS.map(it => (
              <div key={it.name} className="rounded-2xl bg-[#f9f9f8] border border-[#e8e7e4] p-5">
                <p className="text-[15px] font-semibold mb-1.5">{it.name}</p>
                <p className="text-[13px] leading-relaxed text-[#6b6b66]">{it.body}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[#b0afa9] mt-8">Figma, Slack &amp; Canva on Studio · all integrations on Growth</p>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="max-w-[1120px] mx-auto px-6 py-20">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-[#b0afa9] mb-4">Pricing</p>
        <div className="flex items-end justify-between gap-6 flex-wrap mb-12">
          <div>
            <h2 className="text-[clamp(26px,4vw,40px)] font-bold tracking-tight leading-[1.08] max-w-[16ch] mb-3 text-balance">
              Pricing that isn’t a sales call.
            </h2>
            <p className="text-[15px] text-[#6b6b66] max-w-[52ch]">
              Unlimited seats on every plan. No setup fees, no consultants, no annual handcuffs.
            </p>
          </div>
          <div className="flex items-center p-1 rounded-xl bg-[#f0efec]">
            <button onClick={() => setAnnual(false)} className={`text-[13px] font-semibold px-4 py-1.5 rounded-lg transition-colors ${annual ? 'text-[#8a8a85]' : 'bg-white text-[#1a1a1a] shadow-sm'}`}>Monthly</button>
            <button onClick={() => setAnnual(true)} className={`text-[13px] font-semibold px-4 py-1.5 rounded-lg transition-colors ${annual ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#8a8a85]'}`}>Annual −20%</button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <div key={plan.name} className={`rounded-2xl bg-white border p-6 flex flex-col ${plan.popular ? 'border-[#1a1a1a]' : 'border-[#e8e7e4]'}`}>
              {plan.popular && <span className="self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 mb-4 rounded-full bg-[#1a1a1a] text-white">Most popular</span>}
              <p className="text-[14px] font-semibold mb-1">{plan.name}</p>
              <p className="text-[30px] font-bold tracking-tight leading-none mb-1">
                {annual ? plan.annual : plan.monthly}
                <span className="text-[13px] font-medium text-[#b0afa9] ml-1">{plan.name === 'Free' ? plan.per : (annual ? '/mo, billed annually' : plan.per)}</span>
              </p>
              <p className="text-[13px] text-[#6b6b66] mb-5">{plan.who}</p>
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-[#6b6b66]">
                    <svg className="mt-0.5 shrink-0 text-emerald-500" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className={`block text-center text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-colors ${plan.popular ? 'bg-[#1a1a1a] text-white hover:bg-[#333]' : 'border border-[#e8e7e4] hover:border-[#1a1a1a]'}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section className="bg-[#1a1a1a] text-white py-20">
        <div className="max-w-[1120px] mx-auto px-6 text-center">
          <h2 className="text-[clamp(28px,5vw,44px)] font-bold tracking-tight leading-[1.08] max-w-[20ch] mx-auto mb-6 text-balance">
            From Drive chaos to brand system in ten minutes.
          </h2>
          <p className="text-[16px] text-[#a6a5a1] max-w-[52ch] mx-auto mb-8">
            Drag your mess in. Basel tags it, versions it, and gives every client a home.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/login" className="text-[14px] font-semibold px-5 py-3 rounded-xl bg-white text-[#1a1a1a] hover:bg-white/90 transition-colors">
              Start free — no card required →
            </Link>
            <Link href="/meridian" className="text-[14px] font-semibold px-5 py-3 rounded-xl border border-white/25 hover:border-white transition-colors">
              Open the demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#e8e7e4] py-10 bg-white">
        <div className="max-w-[1120px] mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <Wordmark />
          <p className="text-[12px] text-[#b0afa9]">© 2026 Basel — made for agencies</p>
          <div className="flex items-center gap-6 text-[13px] text-[#8a8a85]">
            <a href="#product" className="hover:text-[#1a1a1a] transition-colors">Product</a>
            <a href="#pricing" className="hover:text-[#1a1a1a] transition-colors">Pricing</a>
            <Link href="/meridian" className="hover:text-[#1a1a1a] transition-colors">Demo</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
