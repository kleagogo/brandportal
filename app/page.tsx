'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Basel — brand asset management for agencies ──────────────────────────────
// The marketing site. Product lives at /login (Start free) and /meridian (demo).

const CLIENT_SPACES = [
  { name: 'Copperline Coffee', letter: 'C', color: '#A5502A', assets: 14 },
  { name: 'Northtrail', letter: 'N', color: '#1E5A42', assets: 8 },
  { name: 'Paloma Hotels', letter: 'P', color: '#6C4A8C', assets: 8 },
]

const PROBLEMS = [
  { file: 'final-final-v2.svg', title: 'Four versions of the logo. Six folders.', body: 'Drive, Dropbox, Slack, email, Figma — and nobody’s sure which mark the client actually approved.' },
  { file: '~40 min / search', title: 'Every handoff starts with archaeology.', body: 'New designer, new dev, client request — cue the dig through five tools and three inboxes.' },
  { file: 'guidelines_FINAL.pdf', title: 'Guidelines nobody opens.', body: 'The brand PDF went stale a week after the rebrand shipped. The old logo still makes appearances.' },
]

const FEATURES = [
  { tag: '0.4S', title: 'Instant search', body: 'Across names, tags, colors and clients. The approved file, first result, every time.' },
  { tag: 'AI', title: 'Auto-tagging on upload', body: 'Every file tagged, categorized and duplicate-checked on arrival. Zero manual filing.' },
  { tag: 'v4', title: 'Latest-approved versioning', body: 'One source of truth per asset. Devs, decks and vendors all pull the same file.' },
  { tag: '1-CLICK', title: 'Client portals & approvals', body: 'Send a clean portal, not a zip. Clients approve in one click — no accounts to babysit.' },
  { tag: 'SPACES', title: 'Multi-client spaces', body: 'Every client gets a separate, branded home. Switch in a keystroke, keep permissions clean.' },
  { tag: 'SYNCED', title: 'Living guidelines', body: 'Guidelines that pull straight from the library. Update an asset once — never stale, never a PDF.' },
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
      <span
        className="w-7 h-7 flex items-center justify-center font-[family-name:var(--font-archivo)] font-black text-[15px]"
        style={{ background: 'var(--bl-accent)', color: '#f3f2f2' }}
      >B</span>
      <span className={`font-[family-name:var(--font-archivo)] font-extrabold text-[17px] tracking-tight ${light ? 'text-[var(--bl-bg)]' : 'text-[var(--bl-ink)]'}`}>Basel</span>
    </Link>
  )
}

export default function BaselLanding() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="basel min-h-screen bg-[var(--bl-bg)] text-[var(--bl-ink)] font-[family-name:var(--font-archivo)]">
      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-[var(--bl-bg)]/90 backdrop-blur border-b border-[var(--bl-line)]">
        <div className="max-w-[1140px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-9">
            <Wordmark />
            <div className="hidden md:flex items-center gap-6 text-[14px] font-medium text-[var(--bl-ink-70)]">
              <a href="#product" className="hover:text-[var(--bl-ink)] transition-colors">Product</a>
              <a href="#integrations" className="hover:text-[var(--bl-ink)] transition-colors">Integrations</a>
              <a href="#pricing" className="hover:text-[var(--bl-ink)] transition-colors">Pricing</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/meridian" className="hidden sm:block text-[14px] font-medium text-[var(--bl-ink-70)] hover:text-[var(--bl-ink)] transition-colors">Open the demo</Link>
            <Link href="/login" className="text-[14px] font-semibold px-4 py-2 text-[var(--bl-bg)] hover:bg-[var(--bl-accent-hover)] transition-colors" style={{ background: 'var(--bl-accent)' }}>Start free</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <header className="max-w-[1140px] mx-auto px-6 pt-20 pb-16 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <p className="text-[12px] font-bold tracking-[0.18em] text-[var(--bl-accent)] mb-5">BRAND ASSET MANAGEMENT FOR AGENCIES</p>
          <h1 className="font-extrabold tracking-tight leading-[0.98] text-[clamp(40px,6vw,68px)] text-balance mb-6">
            Stop hunting for the latest logo.
          </h1>
          <p className="text-[17px] leading-relaxed text-[var(--bl-ink-70)] max-w-[48ch] mb-8">
            Basel gives every client one clean brand hub — every asset, every version, findable in seconds. Live in ten minutes. No consultants, no enterprise bloat.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/login" className="text-[15px] font-semibold px-6 py-3 text-[var(--bl-bg)] hover:bg-[var(--bl-accent-hover)] transition-colors" style={{ background: 'var(--bl-accent)' }}>
              Start free — no card required →
            </Link>
            <Link href="/meridian" className="text-[15px] font-semibold px-6 py-3 border border-[var(--bl-ink)] hover:bg-[var(--bl-ink)] hover:text-[var(--bl-bg)] transition-colors">
              See it in action
            </Link>
          </div>
        </div>

        {/* Product mock — a client space with assets */}
        <div className="border border-[var(--bl-line)] bg-[var(--bl-panel)] shadow-[0_12px_32px_rgba(45,43,43,0.14)]">
          <div className="flex items-center gap-2 px-4 h-10 border-b border-[var(--bl-line)] bg-[var(--bl-surface)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--bl-ink-40)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--bl-ink-40)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--bl-ink-40)]" />
            <span className="ml-3 text-[12px] font-mono text-[var(--bl-ink-40)]">app.basel.design</span>
          </div>
          <div className="flex">
            <div className="w-40 shrink-0 border-r border-[var(--bl-line)] p-3 hidden sm:block">
              <p className="text-[10px] font-bold tracking-widest text-[var(--bl-ink-40)] mb-2">CLIENT SPACES</p>
              {CLIENT_SPACES.map((c, i) => (
                <div key={c.name} className={`flex items-center gap-2 px-2 py-1.5 mb-0.5 ${i === 0 ? 'bg-[var(--bl-surface)]' : ''}`}>
                  <span className="w-4 h-4 flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: c.color }}>{c.letter}</span>
                  <span className="text-[11px] font-medium truncate">{c.name}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 p-4">
              <div className="flex items-center gap-2 mb-3 px-2.5 py-1.5 border border-[var(--bl-line)]">
                <span className="text-[11px] font-mono text-[var(--bl-ink-40)]">copperline wordmark dark</span>
                <span className="ml-auto text-[9px] font-bold text-[var(--bl-accent)]">1 EXACT MATCH · 0.4S</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { t: 'Wordmark — Reversed', m: 'SVG · V4 · LATEST', badge: 'Approved', dark: true },
                  { t: 'Wordmark — Primary', m: 'SVG · V4', dark: false },
                  { t: 'Palette — Core', m: 'ASE · V1', swatch: true },
                  { t: 'roastery-04.jpg', m: 'JPG · 4.2 MB', photo: true },
                ].map(a => (
                  <div key={a.t} className="border border-[var(--bl-line)]">
                    <div className="h-14 flex items-center justify-center" style={{ background: a.dark ? '#A5502A' : a.swatch ? 'transparent' : a.photo ? '#c9b8a8' : 'var(--bl-surface)' }}>
                      {a.swatch ? (
                        <div className="flex gap-1">
                          {['#A5502A', '#23150E', '#D9A441', '#F6EFE7'].map(s => <span key={s} className="w-4 h-4" style={{ background: s }} />)}
                        </div>
                      ) : (
                        <span className="text-[11px] font-extrabold" style={{ color: a.dark ? '#F6EFE7' : '#A5502A' }}>{a.photo ? '' : 'Copperline'}</span>
                      )}
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="text-[10px] font-semibold truncate flex items-center gap-1">{a.t}{a.badge && <span className="text-[8px] px-1 text-white" style={{ background: '#1E5A42' }}>{a.badge}</span>}</p>
                      <p className="text-[9px] font-mono text-[var(--bl-ink-40)] truncate">{a.m}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Problem ─────────────────────────────────────────────────────────── */}
      <section className="bg-[var(--bl-ink)] text-[var(--bl-bg)] py-20">
        <div className="max-w-[1140px] mx-auto px-6">
          <p className="text-[12px] font-bold tracking-[0.18em] text-[var(--bl-accent)] mb-4">SOUND FAMILIAR?</p>
          <h2 className="font-extrabold tracking-tight leading-[1.02] text-[clamp(28px,4vw,44px)] max-w-[20ch] mb-12">
            Your brand assets are everywhere. That’s the problem.
          </h2>
          <div className="grid md:grid-cols-3 gap-px bg-[var(--bl-ink-70)]">
            {PROBLEMS.map(p => (
              <div key={p.file} className="bg-[var(--bl-ink)] p-6">
                <p className="inline-block text-[11px] font-mono px-2 py-1 mb-4 text-[var(--bl-bg)]" style={{ background: 'rgba(255,255,255,0.08)' }}>{p.file}</p>
                <p className="text-[18px] font-bold mb-2 leading-snug">{p.title}</p>
                <p className="text-[14px] leading-relaxed text-[var(--bl-ink-40)]">{p.body}</p>
              </div>
            ))}
          </div>
          <blockquote className="mt-14 border-l-2 pl-6" style={{ borderColor: 'var(--bl-accent)' }}>
            <p className="font-extrabold tracking-tight text-[clamp(22px,3vw,32px)] leading-snug max-w-[24ch]">“It isn’t a branding problem. It’s a systems problem.”</p>
            <p className="text-[12px] font-bold tracking-[0.18em] text-[var(--bl-ink-40)] mt-3">— EVERY AGENCY, EVENTUALLY</p>
          </blockquote>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="product" className="max-w-[1140px] mx-auto px-6 py-20">
        <p className="text-[12px] font-bold tracking-[0.18em] text-[var(--bl-accent)] mb-4">THE HUB</p>
        <h2 className="font-extrabold tracking-tight leading-[1.02] text-[clamp(28px,4vw,44px)] max-w-[18ch] mb-12">
          One place. Every client. Under ten seconds.
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--bl-line)] border border-[var(--bl-line)]">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-[var(--bl-bg)] p-6 hover:bg-[var(--bl-panel)] transition-colors">
              <span className="inline-block text-[11px] font-bold px-2 py-1 mb-4 text-[var(--bl-bg)]" style={{ background: 'var(--bl-ink)' }}>{f.tag}</span>
              <p className="text-[18px] font-bold mb-2">{f.title}</p>
              <p className="text-[14px] leading-relaxed text-[var(--bl-ink-70)]">{f.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/meridian" className="text-[15px] font-semibold text-[var(--bl-accent)] hover:text-[var(--bl-accent-hover)] transition-colors">
            Click around the live product demo →
          </Link>
        </div>
      </section>

      {/* ── Integrations ────────────────────────────────────────────────────── */}
      <section id="integrations" className="bg-[var(--bl-surface)] py-20 border-y border-[var(--bl-line)]">
        <div className="max-w-[1140px] mx-auto px-6">
          <p className="text-[12px] font-bold tracking-[0.18em] text-[var(--bl-accent)] mb-4">INTEGRATIONS</p>
          <h2 className="font-extrabold tracking-tight leading-[1.02] text-[clamp(28px,4vw,44px)] max-w-[16ch] mb-4">
            Meets your stack where it already works.
          </h2>
          <p className="text-[16px] text-[var(--bl-ink-70)] max-w-[56ch] mb-12">
            Basel is the source of truth — your tools pull from it, so the right asset shows up where the work happens.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTEGRATIONS.map(it => (
              <div key={it.name} className="bg-[var(--bl-panel)] border border-[var(--bl-line)] p-5">
                <p className="text-[16px] font-bold mb-1.5">{it.name}</p>
                <p className="text-[13.5px] leading-relaxed text-[var(--bl-ink-70)]">{it.body}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-[var(--bl-ink-40)] mt-8">FIGMA, SLACK &amp; CANVA ON STUDIO · ALL INTEGRATIONS ON GROWTH</p>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="max-w-[1140px] mx-auto px-6 py-20">
        <p className="text-[12px] font-bold tracking-[0.18em] text-[var(--bl-accent)] mb-4">PRICING</p>
        <div className="flex items-end justify-between gap-6 flex-wrap mb-12">
          <div>
            <h2 className="font-extrabold tracking-tight leading-[1.02] text-[clamp(28px,4vw,44px)] max-w-[16ch] mb-3">
              Pricing that isn’t a sales call.
            </h2>
            <p className="text-[16px] text-[var(--bl-ink-70)] max-w-[52ch]">
              Unlimited seats on every plan. No setup fees, no consultants, no annual handcuffs.
            </p>
          </div>
          <div className="flex items-center border border-[var(--bl-ink)]">
            <button onClick={() => setAnnual(false)} className="text-[13px] font-semibold px-4 py-2 transition-colors" style={{ background: annual ? 'transparent' : 'var(--bl-accent)', color: annual ? 'var(--bl-ink-70)' : '#f3f2f2' }}>Monthly</button>
            <button onClick={() => setAnnual(true)} className="text-[13px] font-semibold px-4 py-2 transition-colors" style={{ background: annual ? 'var(--bl-accent)' : 'transparent', color: annual ? '#f3f2f2' : 'var(--bl-ink-70)' }}>Annual −20%</button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <div key={plan.name} className={`bg-[var(--bl-panel)] border p-6 flex flex-col ${plan.popular ? 'border-[var(--bl-accent)]' : 'border-[var(--bl-line)]'}`}>
              {plan.popular && <span className="self-start text-[10px] font-bold tracking-[0.14em] px-2 py-1 mb-4 text-[var(--bl-bg)]" style={{ background: 'var(--bl-accent)' }}>MOST POPULAR</span>}
              <p className="text-[15px] font-bold mb-1">{plan.name}</p>
              <p className="font-extrabold tracking-tight text-[34px] leading-none mb-1">
                {annual ? plan.annual : plan.monthly}
                <span className="text-[14px] font-medium text-[var(--bl-ink-40)] ml-1">{plan.name === 'Free' ? plan.per : (annual ? '/mo, billed annually' : plan.per)}</span>
              </p>
              <p className="text-[13.5px] text-[var(--bl-ink-70)] mb-5">{plan.who}</p>
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-[13.5px] text-[var(--bl-ink-70)]">
                    <span className="text-[var(--bl-accent)] font-bold shrink-0">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className={`block text-center text-[14px] font-semibold px-4 py-2.5 transition-colors ${plan.popular ? 'text-[var(--bl-bg)] hover:bg-[var(--bl-accent-hover)]' : 'border border-[var(--bl-ink)] hover:bg-[var(--bl-ink)] hover:text-[var(--bl-bg)]'}`} style={plan.popular ? { background: 'var(--bl-accent)' } : {}}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section className="bg-[var(--bl-ink)] text-[var(--bl-bg)] py-20">
        <div className="max-w-[1140px] mx-auto px-6 text-center">
          <h2 className="font-extrabold tracking-tight leading-[1.02] text-[clamp(30px,5vw,52px)] max-w-[20ch] mx-auto mb-8 text-balance">
            From Drive chaos to brand system in ten minutes.
          </h2>
          <p className="text-[17px] text-[var(--bl-ink-40)] max-w-[52ch] mx-auto mb-8">
            Drag your mess in. Basel tags it, versions it, and gives every client a home.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/login" className="text-[15px] font-semibold px-6 py-3 text-[var(--bl-bg)] hover:bg-[var(--bl-accent-hover)] transition-colors" style={{ background: 'var(--bl-accent)' }}>
              Start free — no card required →
            </Link>
            <Link href="/meridian" className="text-[15px] font-semibold px-6 py-3 border border-[var(--bl-bg)] hover:bg-[var(--bl-bg)] hover:text-[var(--bl-ink)] transition-colors">
              Open the demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--bl-line)] py-10">
        <div className="max-w-[1140px] mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <Wordmark />
          <p className="text-[12px] font-bold tracking-[0.14em] text-[var(--bl-ink-40)]">© 2026 BASEL — MADE FOR AGENCIES</p>
          <div className="flex items-center gap-6 text-[13px] font-medium text-[var(--bl-ink-70)]">
            <a href="#product" className="hover:text-[var(--bl-ink)] transition-colors">Product</a>
            <a href="#pricing" className="hover:text-[var(--bl-ink)] transition-colors">Pricing</a>
            <Link href="/meridian" className="hover:text-[var(--bl-ink)] transition-colors">Demo</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
