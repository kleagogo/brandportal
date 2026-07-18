import { redirect } from 'next/navigation'

// Previews live at /preview/<id> — a bare /preview has nothing to show.
export default function PreviewIndex() {
  redirect('/')
}
