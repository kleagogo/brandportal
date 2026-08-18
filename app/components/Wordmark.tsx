import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * The Pitho logo: the focus mark, six pixels, then the word.
 *
 * The mark is four corner brackets around a centre dot, drawn on the site with
 * CSS borders rather than an SVG, which is why it is easy to miss when reading
 * the page source. Its proportions are fixed: an 18 unit square, 2 unit stroke,
 * 2 unit outer radius on each bracket, and a 4 unit dot. The word sits beside
 * it in Onest Regular at -0.04em.
 *
 * It replaced a rounded "P" tile that appeared, copy-pasted, on three pages.
 */
function FocusMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" className={className} aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 5 V2 A1 1 0 0 1 2 1 H5" />
        <path d="M13 1 H16 A1 1 0 0 1 17 2 V5" />
        <path d="M17 13 V16 A1 1 0 0 1 16 17 H13" />
        <path d="M5 17 H2 A1 1 0 0 1 1 16 V13" />
      </g>
      <circle cx="9" cy="9" r="2" fill="currentColor" />
    </svg>
  )
}
export function Wordmark({
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
    <span className={cn('inline-flex items-center gap-1.5 text-foreground', className)}>
      <FocusMark className={size === 'sm' ? 'size-[15px]' : 'size-[18px]'} />
      <span
        className={cn('font-display font-normal', size === 'sm' ? 'text-[17px]' : 'text-[20px]')}
        style={{ letterSpacing: '-0.04em' }}
      >
        Pitho
      </span>
    </span>
  )

  if (!href) return mark
  return (
    <Link href={href} className="inline-flex items-center hover:opacity-70 transition-opacity">
      {mark}
    </Link>
  )
}
