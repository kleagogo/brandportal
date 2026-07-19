'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [devLink, setDevLink] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('invalid')) {
      setError('That link is invalid or already used — request a fresh one.')
    }
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || state === 'sending') return
    setState('sending')
    setError('')
    try {
      const res = await fetch('/api/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setDevLink(data.devLink || '')
      setState('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('idle')
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f9f8] flex flex-col">
      <nav className="border-b border-[#e8e7e4] bg-white px-5 sm:px-8 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#1a1a1a] rounded-md flex items-center justify-center">
            <div className="w-3 h-3 rounded-sm border-[1.5px] border-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Brand Portal</span>
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[380px] bg-white border border-[#e8e7e4] rounded-2xl p-7">
          {state === 'sent' ? (
            <div>
              <h1 className="text-[19px] font-bold tracking-tight mb-2">Check your email</h1>
              <p className="text-[13.5px] text-[#8a8a85] leading-relaxed mb-4">
                We sent a sign-in link to <span className="font-medium text-[#1a1a1a]">{email}</span>. It works once and expires in an hour.
              </p>
              {devLink && (
                <div className="border-t border-dashed border-[#e8e7e4] pt-4">
                  <p className="text-[12px] text-[#b0afa9] mb-2">
                    Email sending isn’t configured yet (no RESEND_API_KEY) — use your link directly:
                  </p>
                  <a
                    href={devLink}
                    className="block text-center text-[13px] font-semibold bg-[#1a1a1a] text-white px-4 py-2.5 rounded-xl hover:bg-[#333] transition-colors"
                  >
                    Open my sign-in link →
                  </a>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={submit}>
              <h1 className="text-[19px] font-bold tracking-tight mb-1">Sign in</h1>
              <p className="text-[13.5px] text-[#8a8a85] mb-5">No password — we email you a link.</p>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[#e8e7e4] text-[15px] outline-none focus:border-[#1a1a1a] transition-colors placeholder:text-[#b0afa9] mb-3"
              />
              {error && <p className="text-[12.5px] text-red-500 mb-3">{error}</p>}
              <button
                type="submit"
                disabled={state === 'sending'}
                className="w-full py-3 bg-[#1a1a1a] text-white text-[14px] font-semibold rounded-xl hover:bg-[#333] transition-colors disabled:opacity-60"
              >
                {state === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
              </button>
              <p className="text-[11.5px] text-[#b0afa9] mt-4 text-center">
                New here? The same link creates your account.
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
