'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
      // A crashed route answers with an empty body or an HTML error page, and
      // res.json() then fails with a parser message no one can act on.
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) {
        throw new Error(data?.error || `Sign-in is temporarily unavailable (server error ${res.status})`)
      }
      setDevLink(data.devLink || '')
      setState('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('idle')
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border bg-card px-5 sm:px-8 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-[14px]">P</span>
          <span className="text-[15px] font-semibold tracking-tight">Pitho</span>
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[380px] bg-card border border-border rounded-2xl p-7">
          {state === 'sent' ? (
            <div>
              <h1 className="text-[19px] font-bold tracking-tight mb-2">Check your email</h1>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-4">
                We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>. It works once and expires in an hour.
              </p>
              {devLink && (
                <div className="border-t border-dashed border-border pt-4">
                  <p className="text-[12px] text-muted-foreground/60 mb-2">
                    Email sending isn’t configured yet (no RESEND_API_KEY) — use your link directly:
                  </p>
                  <Button nativeButton={false} render={<a href={devLink} />} className="w-full">
                    Open my sign-in link →
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={submit}>
              <h1 className="text-[19px] font-bold tracking-tight mb-1">Sign in</h1>
              <p className="text-[13.5px] text-muted-foreground mb-5">No password — we email you a link.</p>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoFocus
                className="mb-3"
              />
              {error && <p className="text-[12.5px] text-destructive mb-3">{error}</p>}
              <Button type="submit" disabled={state === 'sending'} className="w-full">
                {state === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
              </Button>
              <p className="text-[11.5px] text-muted-foreground/60 mt-4 text-center">
                New here? The same link creates your account.
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
