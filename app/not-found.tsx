import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f9f9f8] flex items-center justify-center px-6">
      <div className="text-center max-w-[380px]">
        <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl mx-auto mb-5 flex items-center justify-center">
          <div className="w-5 h-5 rounded-md border-2 border-white opacity-60" />
        </div>
        <h1 className="text-[22px] font-bold tracking-tight text-[#1a1a1a] mb-2">This hub doesn’t exist</h1>
        <p className="text-[14px] text-[#8a8a85] leading-relaxed mb-6">
          The link may be wrong, or the hub was moved to a new address or deleted by its owner.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="text-[13px] font-semibold bg-[#1a1a1a] text-white px-4 py-2.5 rounded-xl hover:bg-[#333] transition-colors">
            Create your own hub
          </Link>
          <Link href="/dashboard" className="text-[13px] font-semibold border-[1.5px] border-[#e8e7e4] text-[#1a1a1a] px-4 py-2.5 rounded-xl hover:border-[#1a1a1a] transition-colors">
            Your hubs
          </Link>
        </div>
      </div>
    </div>
  )
}
