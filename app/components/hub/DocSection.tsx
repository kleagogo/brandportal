'use client'

import { useHub } from './HubContext'
import { EmptyState } from './EmptyState'
import { Editable } from './Editable'
import { SectionHeader } from './SectionHeader'

/**
 * A section that is words rather than things.
 *
 * Brand story, personality, voice — the parts of a brand book that argue for
 * the rest of it. They can't be `guidelines` sections: that type reads one
 * shared `config.guidelines`, so every one of them would print the same page.
 * A doc keeps its prose under its own id in `config.docs`.
 *
 * Editing enters through the prose itself, the way a card's menu is the way
 * into a card. There is nothing else on the page to put a switch on.
 */
export function DocSection({ sectionId, label, placeholder }: {
  sectionId: string
  label: string
  /** What this particular section is for, shown while it's empty. */
  placeholder: string
}) {
  const { config, editing, update, canEdit, sandbox, active, setEditingSection } = useHub()
  const mayEdit = canEdit || sandbox
  const body = config.docs?.[sectionId]?.body || ''

  function write(v: string) {
    update(c => {
      if (!c.docs) c.docs = {}
      c.docs[sectionId] = { body: v }
    })
  }

  return (
    <div>
      <SectionHeader title={label} description={editing ? placeholder : undefined} />

      {!body && !editing && (
        <EmptyState
          icon="book"
          title={`Nothing in ${label} yet`}
          description={placeholder}
          actionLabel="Write it"
          onAction={() => write('')}
        />
      )}

      {(body || editing) && (
        <div
          className={`max-w-[70ch] ${!editing && mayEdit ? 'cursor-text rounded-lg -mx-2 px-2 py-1 transition-colors hover:bg-muted/60' : ''}`}
          onClick={() => { if (!editing && mayEdit) setEditingSection(active) }}
          title={!editing && mayEdit ? 'Click to edit' : undefined}
        >
          <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
            <Editable multiline value={body} placeholder={placeholder} onChange={write} />
          </div>
        </div>
      )}
    </div>
  )
}
