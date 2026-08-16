'use client'

import { useRef, useState } from 'react'
import { useHub } from './HubContext'
import { Icon } from './Icon'

/**
 * Home — the Brand Agent hero (the Pro centerpiece). Visual and interactive;
 * the chat itself is gated as a Pro feature.
 */
export function HomeSection() {
  const { config } = useHub()
  const agent = config.agent
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const prompts = agent.prompts && agent.prompts.length
    ? agent.prompts
    : ['Review my design', 'Write on-brand copy', 'Find an asset', 'Brand quiz']

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, slug: config.slug }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', text: data.reply || 'Sorry, I could not answer that.' }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  return (
    <div className="min-h-[70vh] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-[560px] mx-auto w-full">
        {config.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={config.logoUrl} alt={config.name} className="w-14 h-14 object-contain mb-5" />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-foreground mb-5" />
        )}
        <h1 className="text-[30px] font-bold tracking-tight mb-2">{agent.name}</h1>
        <p className="text-[15px] text-muted-foreground leading-relaxed mb-2 max-w-[440px]">
          {agent.home || `Your AI-powered assistant for everything ${config.name} brand — from guidelines to copy to asset discovery.`}
        </p>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary bg-primary/15 px-2.5 py-1 rounded-full mb-8">
          <Icon name="sparkles" size={11} /> Pro feature
        </span>

        {messages.length > 0 && (
          <div className="w-full text-left space-y-3 mb-6 max-h-[40vh] overflow-y-auto">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed ${
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                }`}>{m.text}</div>
              </div>
            ))}
            {loading && <p className="text-[13px] text-muted-foreground/60">Thinking…</p>}
            <div ref={bottomRef} />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
          {prompts.map(p => (
            <button
              key={p}
              onClick={() => send(p)}
              className="text-[13px] text-foreground border border-border rounded-full px-3.5 py-1.5 hover:border-ring transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="w-full flex items-center gap-2 border-[1.5px] border-border rounded-2xl px-4 py-3 focus-within:border-ring transition-colors">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={`Ask the ${agent.name} anything…`}
            className="flex-1 min-w-0 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground/60"
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-85 transition-opacity shrink-0"
          >
            <Icon name="up" size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
