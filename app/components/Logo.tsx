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
 * The word does not travel with it. Every place this renders already says
 * Pitho in text nearby, and setting the name twice a few pixels apart reads as
 * a mistake. The lockup with the wordmark is a downloadable asset, not app
 * furniture.
 */
export function Logo({
  href = '/',
  className,
  size = 'md',
}: {
  /** Omit to render as plain text, for places that are already a link. */
  href?: string | null
  className?: string
  size?: 'sm' | 'md'
}) {
  const mark = (
    <svg
      viewBox="0 0 18 18"
      className={cn('text-foreground', size === 'sm' ? 'size-[18px]' : 'size-[20px]', className)}
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

  if (!href) return mark
  return (
    <Link href={href} className="inline-flex items-center hover:opacity-70 transition-opacity">
      {mark}
    </Link>
  )
}
