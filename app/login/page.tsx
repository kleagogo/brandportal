'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Logo } from '@/app/components/Logo'

/**
 * One page for signing up and signing in, because one link does both.
 *
 * Kept deliberately bare: a line saying what will happen, a field, a button.
 * Anything else here is a thing to read before the one action on the page.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [devLink, setDevLink] = useState('')
  const [error, setError] = useState('')

  const [paid, setPaid] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('invalid')) {
      setError('That link is invalid or already used. Request a fresh one.')
    }
    // Sent here from a completed checkout: their payment went through but we
    // couldn't sign them in on the spot. Say so, rather than showing a bare
    // sign-in form to someone who has just handed over money.
    if (params.has('paid')) setPaid(true)
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
    // Sign-in wears the marketing site's clothes rather than the app's: this
    // is the first Pitho screen most people see, and arriving on a white panel
    // from an Ink website reads as a different product. `dark` forces the dark
    // tokens so the card and input follow, and Ink is set explicitly because
    // the app's dark background is a warmer neutral, not the brand ground.
    <div className="dark min-h-screen flex flex-col bg-[#080C12]">
      <nav className="border-b border-white/10 px-5 sm:px-8 h-14 flex items-center">
        <Logo wordmark reverse />
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          {state === 'sent' ? (
            <Card className="bg-[#0E131D] border-white/10">
              <CardContent>
              <h1 className="text-[18px] font-bold tracking-tight mb-2 text-foreground">Check your email</h1>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed">
                We sent a link to <span className="font-medium text-foreground">{email}</span>. Click it and you’re in.
              </p>
              <p className="text-[12.5px] text-muted-foreground/70 leading-relaxed mt-3">
                It works once and expires in an hour. Nothing after a minute? Check spam, or{' '}
                <button
                  onClick={() => { setState('idle'); setDevLink('') }}
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  try another address
                </button>.
              </p>
              {devLink && (
                <div className="border-t border-dashed border-white/15 pt-4 mt-5">
                  <p className="text-[12px] text-muted-foreground/60 mb-2">
                    Email sending isn’t configured yet (no RESEND_API_KEY). Use your link directly:
                  </p>
                  <Button nativeButton={false} render={<a href={devLink} />} variant="default" className="w-full">
                    Open my sign-in link →
                  </Button>
                </div>
              )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#0E131D] border-white/10">
              <CardContent>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-5">
                {paid
                  ? 'Payment received, thank you. Your account is ready. Enter the email you paid with and we’ll send your way in.'
                  : 'We’ll email you a link to sign up.'}
              </p>

              <form onSubmit={submit}>
                <Label htmlFor="email" className="sr-only">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoFocus
                  className="mb-3"
                />
                {error && <p className="text-[12.5px] text-destructive mb-3">{error}</p>}
                <Button type="submit" variant="default" disabled={state === 'sending'} className="w-full">
                  {state === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
                </Button>
              </form>

              <p className="text-[12.5px] text-muted-foreground mt-4">
                Already have an account? The same link signs you in.
              </p>
              </CardContent>
            </Card>
          )}

          <p className="text-[12px] text-muted-foreground/60 text-center mt-5">by Pitho.io</p>
        </div>
      </main>
    </div>
  )
}
