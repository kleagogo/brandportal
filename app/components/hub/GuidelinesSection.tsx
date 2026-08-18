'use client'

import { useHub } from './HubContext'
import { EmptyState } from './EmptyState'
import { Editable } from './Editable'
import { Icon } from './Icon'
import { HubCard } from './HubCard'

export function GuidelinesSection() {
  const { config, editing, update } = useHub()
  const { voice, usage } = config.guidelines

  return (
    <div>
      <h1 className="text-[22px] font-bold tracking-tight mb-1">Guidelines</h1>
      <p className="text-[14px] text-muted-foreground mb-8">How to represent our brand correctly.</p>

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

      {voice && (
        <div className="mb-10">
          <p className="text-[13px] font-medium text-muted-foreground mb-4">
            <Editable inline value={voice.title} placeholder="Section title" onChange={v => update(c => { c.guidelines.voice!.title = v })} />
          </p>
          <div className="text-[14px] text-muted-foreground mb-4 max-w-[60ch]">
            <Editable multiline value={voice.description} placeholder="Describe your brand voice" onChange={v => update(c => { c.guidelines.voice!.description = v })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {voice.principles.map((p, i) => (
              <HubCard
                key={i}
                className="relative group"
                header={
                  <p className="text-[13px] font-semibold text-foreground min-w-0 truncate">
                    <Editable value={p.name} placeholder="Principle" onChange={v => update(c => { c.guidelines.voice!.principles[i].name = v })} />
                  </p>
                }
              >
                {editing && (
                  <button
                    onClick={() => update(c => { c.guidelines.voice!.principles.splice(i, 1) })}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full text-muted-foreground/60 hover:text-destructive items-center justify-center hidden group-hover:flex"
                    title="Remove principle"
                  >
                    <Icon name="close" size={11} />
                  </button>
                )}
                <p className="text-[14px] font-semibold text-foreground mb-1">
                  <Editable value={p.name} placeholder="Principle" onChange={v => update(c => { c.guidelines.voice!.principles[i].name = v })} />
                </p>
                <div className="text-[13px] text-muted-foreground leading-relaxed">
                  <Editable multiline value={p.description} placeholder="What does this mean in practice?" onChange={v => update(c => { c.guidelines.voice!.principles[i].description = v })} />
                </div>
              </HubCard>
            ))}
            {editing && (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RuleList
            tone="do"
            items={usage.dos}
            onChange={(i, v) => update(c => { c.guidelines.usage!.dos[i] = v })}
            onRemove={i => update(c => { c.guidelines.usage!.dos.splice(i, 1) })}
            onAdd={() => update(c => { c.guidelines.usage!.dos.push('') })}
          />
          <RuleList
            tone="dont"
            items={usage.donts}
            onChange={(i, v) => update(c => { c.guidelines.usage!.donts[i] = v })}
            onRemove={i => update(c => { c.guidelines.usage!.donts.splice(i, 1) })}
            onAdd={() => update(c => { c.guidelines.usage!.donts.push('') })}
          />
        </div>
      )}
    </div>
  )
}

function RuleList({
  tone, items, onChange, onRemove, onAdd,
}: {
  tone: 'do' | 'dont'
  items: string[]
  onChange: (i: number, v: string) => void
  onRemove: (i: number) => void
  onAdd: () => void
}) {
  const { editing } = useHub()
  const isDo = tone === 'do'

  return (
    <div>
      <p className={`text-[13px] font-medium mb-4 ${isDo ? 'text-primary' : 'text-destructive'}`}>
        {isDo ? 'Do' : "Don't"}
      </p>
      <div className="space-y-2">
        {items.map((item, i) => (
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
            {editing && (
              <button onClick={() => onRemove(i)} className="text-muted-foreground/60 hover:text-destructive shrink-0 hidden group-hover:block" title="Remove">
                <Icon name="close" size={11} />
              </button>
            )}
          </div>
        ))}
        {editing && (
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
