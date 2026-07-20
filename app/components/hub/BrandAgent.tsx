'use client'

import { useRef, useState } from 'react'
import { useHub } from './HubContext'
import { Icon } from './Icon'

export function BrandAgent() {
  const { config } = useHub()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, slug: config.slug }),
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

  if (!config.agent.enabled) return null

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-[var(--hub-btn)] text-[var(--hub-btn-text)] rounded-full flex items-center justify-center shadow-lg hover:opacity-85 transition-colors z-50"
        title={config.agent.name}
      >
        <Icon name={open ? 'close' : 'chat'} size={18} />
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 w-80 max-w-[calc(100vw-3rem)] bg-[var(--hub-panel)] border border-[var(--hub-border)] rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden" style={{ height: 420 }}>
          <div className="px-4 py-3 border-b border-[var(--hub-border)] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <p className="text-[13px] font-semibold">{config.agent.name}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-[12px] text-[var(--hub-muted)] leading-relaxed">{config.agent.greeting}</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[13px] leading-relaxed ${
                  m.role === 'user' ? 'bg-[var(--hub-btn)] text-[var(--hub-btn-text)]' : 'bg-[var(--hub-soft)] text-[var(--hub-text)]'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[var(--hub-soft)] px-3 py-2 rounded-xl">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-[#b0afa9] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-[var(--hub-border)] flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about our brand…"
              className="flex-1 text-[13px] px-3 py-2 bg-[var(--hub-soft)] rounded-lg outline-none placeholder:text-[var(--hub-faint)]"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-8 h-8 bg-[var(--hub-btn)] text-[var(--hub-btn-text)] rounded-lg flex items-center justify-center disabled:opacity-40 hover:opacity-85 transition-colors shrink-0"
            >
              <Icon name="send" size={13} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
