import { PRIVATE_PAGE } from '@/lib/seo'
import { redirect } from 'next/navigation'

// Previews live at /preview/<id> — a bare /preview has nothing to show.
export const metadata = { ...PRIVATE_PAGE, title: 'Preview — Pitho' }

export default function PreviewIndex() {
  redirect('/')
}
