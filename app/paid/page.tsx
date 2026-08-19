import type { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Logo } from '@/app/components/Logo'

export const metadata: Metadata = {
  title: 'Payment received · Pitho',
  robots: { index: false, follow: false },
}

/**
 * The landing for someone whose payment went through but who couldn't be
 * signed in on the spot — the webhook hadn't reached us yet.
 *
 * It says the two things they need: the money arrived, and the way in is
 * already in their inbox. No form: asking someone to type the address they
 * just typed into a payment page reads as though something went wrong.
 */
export default function PaidPage() {
  return (
    <div className="dark min-h-screen flex flex-col bg-[#080C12]">
      <nav className="border-b border-white/10 px-5 sm:px-8 h-14 flex items-center">
        <Logo wordmark reverse />
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          <Card className="bg-[#0E131D] border-white/10">
            <CardContent>
              <h1 className="text-[18px] font-bold tracking-tight mb-2 text-foreground">
                Payment received, thank you
              </h1>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed">
                Your account is ready. We’ve emailed you a sign-in button, so click that and
                you’re in.
              </p>
              <p className="text-[12.5px] text-muted-foreground/70 leading-relaxed mt-3">
                Nothing after a minute? Check spam, or request a fresh link with the address you
                paid with.
              </p>
              <div className="mt-5">
                <Button nativeButton={false} render={<a href="/login" />} variant="default" className="w-full">
                  Send me another link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
