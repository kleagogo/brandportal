'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function NewHubButton() {
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function create() {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/hubs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/${data.slug}`)
    } catch {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <a href="/" className="text-[13px] font-semibold border border-[#e8e7e4] text-[#1a1a1a] px-4 py-2.5 rounded-xl hover:border-[#1a1a1a] transition-colors">
        Scan a website
      </a>
      <button
        onClick={create}
        disabled={busy}
        className="text-[13px] font-semibold bg-[#1a1a1a] text-white px-4 py-2.5 rounded-xl hover:bg-[#333] transition-colors disabled:opacity-60"
      >
        {busy ? 'Creating…' : '+ New blank hub'}
      </button>
    </div>
  )
}

export function AccountMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white text-[13px] font-semibold flex items-center justify-center hover:bg-[#333] transition-colors uppercase"
        title={email}
      >
        {email[0]}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-40 w-56 bg-white border border-[#e8e7e4] rounded-xl shadow-xl p-1.5">
            <p className="px-2.5 py-2 text-[12px] text-[#8a8a85] truncate border-b border-[#f0efec] mb-1">{email}</p>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="w-full text-left px-2.5 py-2 text-[13px] text-[#1a1a1a] hover:bg-[#f5f5f3] rounded-lg transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
