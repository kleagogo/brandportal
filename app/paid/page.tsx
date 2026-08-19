import type { Metadata } from 'next'
import { Logo } from '@/app/components/Logo'
import { Celebration } from './Celebration'

export const metadata: Metadata = {
  title: 'Payment received',
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
      <Celebration />
    </div>
  )
}
