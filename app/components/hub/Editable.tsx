'use client'

import { useHub } from './HubContext'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { CSSProperties } from 'react'

/**
 * Text that becomes an input in edit mode.
 *
 * The input inherits the exact typography of the text it replaces (Tailwind's
 * preflight sets `font: inherit` on form elements), so editing happens in
 * place with no layout jump.
 *
 * Edit state comes from the section unless the caller says otherwise. A card
 * that opens on its own has to pass its own, or its name and note stay text
 * while its tags turn into inputs.
 */
export function Editable({
  value,
  onChange,
  className = '',
  style,
  placeholder = 'Empty',
  multiline = false,
  inline = false,
  editing: editingOverride,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
  style?: CSSProperties
  placeholder?: string
  multiline?: boolean
  /** Size the input to its content instead of filling the row. */
  inline?: boolean
  /** Override the section's edit state, for a card editing on its own. */
  editing?: boolean
}) {
  const { editing: sectionEditing } = useHub()
  const editing = editingOverride ?? sectionEditing

  if (!editing) {
    if (!value) return null
    return <span className={className} style={style}>{value}</span>
  }

  // A field in edit mode should look like a field. The dashed outline this
  // used to draw was invisible until you knew to look for it, so the answer to
  // "how do I change the name" was to try clicking the name. These are the
  // library's own controls, sized to sit in the line they replace.
  const shared = cn('h-auto py-0.5 text-[length:inherit] font-[inherit] leading-[inherit]', className)

  if (multiline) {
    return (
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          // Enter is "done" here. Shift+Enter still breaks the line, for the
          // rare note that wants two.
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
        placeholder={placeholder}
        rows={Math.max(2, value.split('\n').length)}
        className={cn(shared, 'w-full resize-none')}
        style={style}
      />
    )
  }

  return (
    <Input
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } }}
      placeholder={placeholder}
      size={inline ? Math.max(value.length, placeholder.length, 4) : undefined}
      className={cn(shared, inline ? 'w-auto' : 'w-full')}
      style={style}
    />
  )
}
