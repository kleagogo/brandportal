'use client'

import { useHub } from './HubContext'
import type { CSSProperties } from 'react'

/**
 * Text that becomes an input in edit mode.
 *
 * The input inherits the exact typography of the text it replaces (Tailwind's
 * preflight sets `font: inherit` on form elements), so editing happens in
 * place with no layout jump.
 */
export function Editable({
  value,
  onChange,
  className = '',
  style,
  placeholder = 'Empty',
  multiline = false,
  inline = false,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
  style?: CSSProperties
  placeholder?: string
  multiline?: boolean
  /** Size the input to its content instead of filling the row. */
  inline?: boolean
}) {
  const { editing } = useHub()

  if (!editing) {
    if (!value) return null
    return <span className={className} style={style}>{value}</span>
  }

  const editCls = `${className} bg-transparent rounded-md outline-none border border-dashed border-border hover:border-muted-foreground focus:border-ring focus:bg-card px-1 -mx-1 transition-colors placeholder:text-muted-foreground/60`

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={Math.max(2, value.split('\n').length)}
        className={`${editCls} w-full resize-none block`}
        style={style}
      />
    )
  }

  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      size={inline ? Math.max(value.length, placeholder.length, 4) : undefined}
      className={`${editCls} ${inline ? '' : 'w-full'}`}
      style={style}
    />
  )
}
