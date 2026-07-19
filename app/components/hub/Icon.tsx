export function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const s = size
  switch (name) {
    case 'logo':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor"/><rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor" opacity=".4"/><rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor" opacity=".4"/><rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor"/></svg>
    case 'colors':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 2C8 2 12 5 12 8C12 11 8 14 8 14" fill="currentColor" opacity=".3"/></svg>
    case 'type':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M2 4h12M8 4v9M5 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    case 'screenshots':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M1 6h14" stroke="currentColor" strokeWidth="1"/></svg>
    case 'guidelines':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M3 4h10M3 8h7M3 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    case 'link':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M6 10L10 6M7 4h5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'download':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'copy':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M3 11V3h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    case 'chat':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M2 3h12v8H9l-3 2v-2H2V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
    case 'send':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M13 3L2 7l4.5 1.5L13 3zM13 3L8.5 13 6.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'close':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    case 'edit':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2L5 13l-2.5.5L3 11l8.5-8.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
    case 'check':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'plus':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    case 'trash':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M3 4.5h10M6.5 4V3h3v1M4.5 4.5l.5 8.5h6l.5-8.5M6.8 7v4M9.2 7v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'share':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="12" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="12" cy="12.5" r="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5.8 7L10.2 4.4M5.8 9l4.4 2.6" stroke="currentColor" strokeWidth="1.4"/></svg>
    case 'upload':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 11V3M5 6l3-3 3 3M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'up':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'down':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'menu':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    case 'gear':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.4"/><path d="M8 1.8v1.8M8 12.4v1.8M1.8 8h1.8M12.4 8h1.8M3.6 3.6l1.3 1.3M11.1 11.1l1.3 1.3M12.4 3.6l-1.3 1.3M4.9 11.1l-1.3 1.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
    case 'file':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M4 1.5h5L13 5.5v9a.5.5 0 01-.5.5h-8.5a.5.5 0 01-.5-.5v-13a.5.5 0 01.5-.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M9 1.5V5.5H13" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
    default:
      return null
  }
}
