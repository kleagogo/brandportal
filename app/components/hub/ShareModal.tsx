'use client'

import { useEffect, useState } from 'react'
import { useHub } from './HubContext'
import { Icon } from './Icon'

export function ShareModal({ onClose }: { onClose: () => void }) {
  const { config } = useHub()
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(`${window.location.origin}/${config.slug}`)
  }, [config.slug])

  function copy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-[#e8e7e4] shadow-2xl w-full max-w-[440px] p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#b0afa9] hover:text-[#1a1a1a] transition-colors" title="Close">
          <Icon name="close" size={14} />
        </button>

        <h2 className="text-[17px] font-bold tracking-tight mb-1">Share this hub</h2>
        <p className="text-[13px] text-[#8a8a85] mb-5">Anyone with the link can view — no account needed.</p>

        <div className="flex gap-2 mb-5">
          <div className="flex-1 px-3 py-2.5 bg-[#f5f5f3] rounded-xl text-[13px] font-mono text-[#1a1a1a] truncate">
            {url || `/${config.slug}`}
          </div>
          <button
            onClick={copy}
            className="px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-semibold rounded-xl hover:bg-[#333] transition-colors whitespace-nowrap"
          >
            {copied ? 'Copied ✓' : 'Copy link'}
          </button>
        </div>

        <div className="border-t border-dashed border-[#e8e7e4] pt-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-[#1a1a1a]">PIN protection</p>
              <p className="text-[12px] text-[#b0afa9]">Require a 4-digit code to view</p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8a8a85] bg-[#f0efec] px-2 py-1 rounded-md whitespace-nowrap">Coming soon</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-[#1a1a1a]">Invite editors</p>
              <p className="text-[12px] text-[#b0afa9]">Let teammates edit by email invite</p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8a8a85] bg-[#f0efec] px-2 py-1 rounded-md whitespace-nowrap">Coming soon</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-[#1a1a1a]">Custom domain</p>
              <p className="text-[12px] text-[#b0afa9]">brand.yourcompany.com</p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#d96e30] bg-[#f7e1d3] px-2 py-1 rounded-md whitespace-nowrap">Pro</span>
          </div>
        </div>
      </div>
    </div>
  )
}
