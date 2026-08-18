'use client'

import { useState } from 'react'
import { useHub } from './HubContext'
import { EmptyState } from './EmptyState'
import { Editable } from './Editable'
import { useConfirm } from './useConfirm'
import { Icon } from './Icon'
import { HubCard } from './HubCard'
import { SectionHeader } from './SectionHeader'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Tone = 'all' | 'do' | 'dont'
type GuidelineSort = 'added' | 'name'

const SORT_LABELS: Record<GuidelineSort, string> = {
  added: 'Order added',
  name: 'Name',
}

export function GuidelinesSection({ label = 'Guidelines' }: { label?: string }) {
  const { config, editing, update, canEdit, sandbox } = useHub()
  const { confirm, confirmDialog } = useConfirm()
  const { voice, usage } = config.guidelines
  const [query, setQuery] = useState('')
  const [tone, setTone] = useState<Tone>('all')
  const [sort, setSort] = useState<GuidelineSort>('added')
  const [copied, setCopied] = useState<number | null>(null)

  const mayEdit = canEdit || sandbox
  const needle = query.trim().toLowerCase()
  const total =
    (voice?.principles.length ?? 0) + (usage?.dos.length ?? 0) + (usage?.donts.length ?? 0)

  function copyPrinciple(i: number, name: string, description: string) {
    navigator.clipboard.writeText(description ? `${name} — ${description}` : name)
    setCopied(i)
    setTimeout(() => setCopied(null), 1500)
  }

  /**
   * Principles paired with their stored index before filtering.
   *
   * Every write is `c.guidelines.voice.principles[i]`, so searching a list that
   * renumbered would edit whichever principle happened to land in that slot.
   */
  const principles = (voice?.principles || [])
    .map((p, i) => ({ p, i }))
    .filter(({ p }) =>
      !needle ||
      p.name.toLowerCase().includes(needle) ||
      p.description.toLowerCase().includes(needle))
    .sort((a, b) => (sort === 'name' ? a.p.name.localeCompare(b.p.name) : 0))

  return (
    <div>
      {confirmDialog}

      <SectionHeader
        title={label}
        description="How to represent our brand correctly."
        actions={
          editing && !voice && !usage && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => update(c => {
                c.guidelines.voice = { title: 'Brand voice', description: '', principles: [] }
                c.guidelines.usage = { dos: [], donts: [] }
              })}
            >
              <Icon name="plus" size={13} /> Write guidelines
            </Button>
          )
        }
        toolbar={total > 3}
        search={{
          value: query,
          onChange: setQuery,
          placeholder: 'Search guidelines…',
          label: 'Search guidelines',
        }}
        filters={[{
          value: tone,
          onChange: v => setTone(v as Tone),
          label: 'Filter by kind',
          options: [
            { value: 'all', label: 'Everything' },
            { value: 'do', label: 'Do' },
            { value: 'dont', label: "Don't" },
          ],
        }]}
        sort={{
          value: sort,
          onChange: v => setSort(v as GuidelineSort),
          label: 'Sort principles',
          options: (Object.keys(SORT_LABELS) as GuidelineSort[]).map(k => ({ value: k, label: SORT_LABELS[k] })),
        }}
      />

      {!voice && !usage && !editing && (
        <EmptyState
          title="No guidelines yet"
          description="Write the few rules that keep the brand recognisable when someone else is using it."
          actionLabel="Write guidelines"
          onAction={() => update(c => {
            c.guidelines.voice = { title: 'Brand voice', description: '', principles: [] }
            c.guidelines.usage = { dos: [], donts: [] }
          })}
        />
      )}

      {/* Principles are the voice half. The tone filter is about rules, so it
          hides these only when someone has narrowed to Do or Don't. */}
      {voice && tone === 'all' && (
        <div className="mb-10">
          <p className="text-[13px] font-medium text-muted-foreground mb-4">
            <Editable inline value={voice.title} placeholder="Section title" onChange={v => update(c => { c.guidelines.voice!.title = v })} />
          </p>
          <div className="text-[14px] text-muted-foreground mb-4 max-w-[60ch]">
            <Editable multiline value={voice.description} placeholder="Describe your brand voice" onChange={v => update(c => { c.guidelines.voice!.description = v })} />
          </div>

          {needle && principles.length === 0 && (
            <p className="text-[13px] text-muted-foreground">No principles match that.</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {principles.map(({ p, i }) => (
              <HubCard
                key={i}
                className="group relative"
                /* The name lived in the header band and again in the body, so
                   editing put two live inputs on the same field. It belongs in
                   the band, where every other card's title sits. */
                header={
                  <p className="text-[13px] font-semibold text-foreground min-w-0 truncate">
                    <Editable value={p.name} placeholder="Principle" onChange={v => update(c => { c.guidelines.voice!.principles[i].name = v })} />
                  </p>
                }
                action={
                  <ButtonGroup className="shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyPrinciple(i, p.name, p.description)}
                      title={`Copy "${p.name}"`}
                    >
                      <Icon name="copy" size={14} /> {copied === i ? 'Copied' : 'Copy'}
                    </Button>
                    {mayEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="outline" size="icon-sm" aria-label={`Actions for ${p.name}`}>
                              <Icon name="more" size={14} />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => copyPrinciple(i, p.name, p.description)}>
                              <Icon name="copy" size={14} /> Copy text
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={async () => {
                                if (!(await confirm({
                                  title: `Delete "${p.name}"?`,
                                  confirmLabel: 'Delete principle',
                                  destructive: true,
                                }))) return
                                update(c => { c.guidelines.voice!.principles.splice(i, 1) })
                              }}
                            >
                              <Icon name="trash" size={14} /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </ButtonGroup>
                }
              >
                <div className="text-[13px] text-muted-foreground leading-relaxed">
                  <Editable multiline value={p.description} placeholder="What does this mean in practice?" onChange={v => update(c => { c.guidelines.voice!.principles[i].description = v })} />
                </div>
              </HubCard>
            ))}
            {editing && !needle && (
              <button
                onClick={() => update(c => { c.guidelines.voice!.principles.push({ name: 'New principle', description: '' }) })}
                className="border-2 border-dashed border-border rounded-xl p-4 text-muted-foreground/60 hover:border-ring hover:text-foreground transition-colors flex items-center justify-center gap-2 min-h-[88px]"
              >
                <Icon name="plus" size={13} /> <span className="text-[13px] font-medium">Add principle</span>
              </button>
            )}
          </div>
        </div>
      )}

      {usage && (
        <div className={`grid grid-cols-1 gap-6 ${tone === 'all' ? 'md:grid-cols-2' : ''}`}>
          {tone !== 'dont' && (
            <RuleList
              tone="do"
              items={usage.dos}
              needle={needle}
              onChange={(i, v) => update(c => { c.guidelines.usage!.dos[i] = v })}
              onRemove={i => update(c => { c.guidelines.usage!.dos.splice(i, 1) })}
              onAdd={() => update(c => { c.guidelines.usage!.dos.push('') })}
            />
          )}
          {tone !== 'do' && (
            <RuleList
              tone="dont"
              items={usage.donts}
              needle={needle}
              onChange={(i, v) => update(c => { c.guidelines.usage!.donts[i] = v })}
              onRemove={i => update(c => { c.guidelines.usage!.donts.splice(i, 1) })}
              onAdd={() => update(c => { c.guidelines.usage!.donts.push('') })}
            />
          )}
        </div>
      )}
    </div>
  )
}

function RuleList({
  tone, items, needle, onChange, onRemove, onAdd,
}: {
  tone: 'do' | 'dont'
  items: string[]
  /** Lowercased search text, or '' for everything. */
  needle: string
  onChange: (i: number, v: string) => void
  onRemove: (i: number) => void
  onAdd: () => void
}) {
  const { editing } = useHub()
  const isDo = tone === 'do'
  // Same pairing rule as everywhere else: the index is the stored one.
  const visible = items
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => !needle || item.toLowerCase().includes(needle))

  return (
    <div>
      <p className={`text-[13px] font-medium mb-4 ${isDo ? 'text-primary' : 'text-destructive'}`}>
        {isDo ? 'Do' : "Don't"}
      </p>
      <div className="space-y-2">
        {visible.map(({ item, i }) => (
          <div key={i} className={`flex items-start gap-3 rounded-xl p-3 group ${isDo ? 'bg-primary/10 border border-primary/20' : 'bg-destructive/10 border border-destructive/20'}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isDo ? 'bg-primary' : 'bg-destructive'}`}>
              {isDo ? (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M2 2l4 4M6 2L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
              )}
            </span>
            <div className="text-[13px] text-foreground leading-relaxed flex-1 min-w-0">
              <Editable multiline value={item} placeholder="Write the rule…" onChange={v => onChange(i, v)} />
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(item) }}
              className="text-muted-foreground/60 hover:text-foreground shrink-0 hidden group-hover:block"
              title="Copy rule"
              aria-label="Copy rule"
            >
              <Icon name="copy" size={12} />
            </button>
            {editing && (
              <button onClick={() => onRemove(i)} className="text-muted-foreground/60 hover:text-destructive shrink-0 hidden group-hover:block" title="Remove" aria-label="Remove rule">
                <Icon name="close" size={11} />
              </button>
            )}
          </div>
        ))}
        {needle && visible.length === 0 && (
          <p className="text-[13px] text-muted-foreground">Nothing here matches.</p>
        )}
        {editing && !needle && (
          <button
            onClick={onAdd}
            className="w-full border-2 border-dashed border-border rounded-xl p-2.5 text-muted-foreground/60 hover:border-ring hover:text-foreground transition-colors flex items-center justify-center gap-1.5 text-[13px] font-medium"
          >
            <Icon name="plus" size={12} /> Add rule
          </button>
        )}
      </div>
    </div>
  )
}
