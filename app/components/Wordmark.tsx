import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * The Pitho logo.
 *
 * The mark is the word itself. The marketing site sets it in Onest Regular
 * with the letter-spacing pulled in to -0.04em, and nothing else: no symbol,
 * no lockup, no container. This renders those exact values so the product and
 * the site show the same logo rather than two cousins of one.
 *
 * It replaced a rounded "P" tile that appeared, copy-pasted, on three pages.
 */
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
    <span
      className={cn(
        'font-display font-normal text-foreground',
        size === 'sm' ? 'text-[17px]' : 'text-[20px]',
        className,
      )}
      style={{ letterSpacing: '-0.04em' }}
    >
      Pitho
    </span>
  )

  if (!href) return mark
  return (
    <Link href={href} className="inline-flex items-center hover:opacity-70 transition-opacity">
      {mark}
    </Link>
  )
}
