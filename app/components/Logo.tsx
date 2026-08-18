import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * The Pitho logo: the focus mark.
 *
 * Four corner brackets around a centre dot, a viewfinder, which is what
 * "bring every brand into focus" is pointing at. The site draws it with CSS
 * borders on four divs rather than an SVG, so its proportions are written down
 * here instead: an 18 unit box, 5 unit brackets at 2 unit stroke with a 2 unit
 * outer radius, and a 4 unit dot.
 *
 * The word does not travel with it by default. Most places this renders
 * already say Pitho in text nearby, and setting the name twice a few pixels
 * apart reads as a mistake.
 *
 * Pass `wordmark` where that isn't true. Sign-in is the case: the mark sits
 * alone in an otherwise empty bar, so without the word the page never says
 * whose product you are handing an email address to.
 */
export function Logo({
  href = '/',
  className,
  size = 'md',
  wordmark = false,
  reverse = false,
}: {
  /** Omit to render as plain text, for places that are already a link. */
  href?: string | null
  className?: string
  size?: 'sm' | 'md'
  /** Set the name beside the mark, where nothing else on the page does. */
  wordmark?: boolean
  /** White lockup, for the brand's own Ink ground. */
  reverse?: boolean
}) {
  const mark = (
    <svg
      viewBox="0 0 18 18"
      className={cn(!reverse && 'text-foreground', wordmark ? 'size-[18px]' : size === 'sm' ? 'size-[18px]' : 'size-[20px]', className)}
      style={{ color: reverse ? '#FAFAFA' : undefined }}
      role="img"
      aria-label="Pitho"
    >
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 5 V2 A1 1 0 0 1 2 1 H5" />
        <path d="M13 1 H16 A1 1 0 0 1 17 2 V5" />
        <path d="M17 13 V16 A1 1 0 0 1 16 17 H13" />
        <path d="M5 17 H2 A1 1 0 0 1 1 16 V13" />
      </g>
      <circle cx="9" cy="9" r="2" fill="currentColor" />
    </svg>
  )

  /**
   * The lockup, set the way the marketing site sets it rather than from the
   * SVG file. The file packs the word tight against the mark (3.9px), the site
   * gives it 8px, and side by side that reads as two different logos. Values
   * lifted from the published nav: 18px mark, 8px gap, Onest regular at 24px
   * and -0.04em, in #FAFAFA rather than pure white.
   */
  const lockup = wordmark ? (
    <span className="inline-flex items-center gap-2">
      {mark}
      <span
        className="font-[family-name:var(--font-display)] font-normal leading-[1.3em]"
        style={{ fontSize: 24, letterSpacing: '-0.04em', color: reverse ? '#FAFAFA' : '#080C12' }}
      >
        Pitho
      </span>
    </span>
  ) : (
    mark
  )

  if (!href) return lockup
  return (
    <Link href={href} className="inline-flex items-center hover:opacity-70 transition-opacity">
      {lockup}
    </Link>
  )
}
