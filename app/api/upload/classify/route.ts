import { NextRequest, NextResponse } from 'next/server'
import { canEditHub, getHub, getMeta } from '@/lib/store'
import { getSessionUser } from '@/lib/auth'
import { allow, clientIp } from '@/lib/ratelimit'

/**
 * Where do these folders belong?
 *
 * Only the folders the rules in route-files.ts couldn't place get this far, so
 * this is a small text call — folder names and a few filenames, never the files
 * themselves. Answering "no idea" is fine: the caller falls back to proposing a
 * new section named after the folder.
 */

/**
 * Sorting folder names is shallow work, so this runs on the same small model
 * as the hub's other AI features and costs about a penny per upload. Swap the
 * id for a larger model if the guesses aren't good enough.
 */
const MODEL = 'claude-haiku-4-5-20251001'

/** Bounds on what one request may ask about, so cost per upload stays flat. */
const MAX_FOLDERS = 25
const MAX_SAMPLES = 6

interface FolderAsk {
  key: string
  name: string
  files: string[]
}

export async function POST(req: NextRequest) {
  let slug = ''
  let folders: FolderAsk[] = []
  try {
    const body = await req.json()
    slug = String(body?.slug || '')
    folders = Array.isArray(body?.folders) ? body.folders.slice(0, MAX_FOLDERS) : []
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const hub = await getHub(slug)
  const meta = await getMeta(slug)
  if (!hub || !canEditHub(meta, await getSessionUser())) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }
  // Same reasoning as the describe route: the demo is editable without signing
  // in, so it must not reach the model. Sorting still runs on the rules alone.
  if (meta.demo) return NextResponse.json({ answers: [] })
  if (!folders.length) return NextResponse.json({ answers: [] })

  if (!allow(`classify:${clientIp(req)}`, 60, 60 * 60_000)) {
    return NextResponse.json({ answers: [] })
  }

  // No key means no AI: the caller keeps the rules' own answer, which is to
  // offer a new section per folder. Sorting still works, just less cleverly.
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ answers: [] })

  const sections = hub.sections
    .filter(s => ['assets', 'colors', 'typography', 'guidelines'].includes(s.type))
    .map(s => `- ${s.id} — "${s.label}"`)
    .join('\n')

  const list = folders
    .map((f, i) => {
      const files = (Array.isArray(f.files) ? f.files : []).slice(0, MAX_SAMPLES).join(', ')
      return `${i + 1}. key="${String(f.key).slice(0, 80)}" folder="${String(f.name).slice(0, 60)}" files: ${files || 'unknown'}`
    })
    .join('\n')

  const prompt = `A brand folder was uploaded to a brand hub. These sections already exist:

${sections}

These folders from the upload could not be matched to a section automatically. For each one, decide where it belongs:
- If it clearly fits an existing section, give that section's id.
- Otherwise give a short new section name (1-3 words, title case, e.g. "Motion", "Packaging", "Email Signatures").

Folders:
${list}

Return ONLY JSON, no prose:
{"answers":[{"key":"<the key given above>","sectionId":"<existing id, or null>","label":"<new section name, or null>"}]}`

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      },
      { timeout: 15000 }
    )

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const parsed = JSON.parse(text.match(/\{[\s\S]+\}/)?.[0] || '{}')
    const answers = Array.isArray(parsed.answers) ? parsed.answers : []

    // Only hand back answers about folders we actually asked about.
    const asked = new Set(folders.map(f => String(f.key)))
    return NextResponse.json({
      answers: (answers as unknown[])
        .filter((a): a is Record<string, unknown> => Boolean(a) && typeof a === 'object')
        .filter((a: Record<string, unknown>) => asked.has(String(a.key)))
        .map((a: Record<string, unknown>) => ({
          key: String(a.key),
          sectionId: typeof a.sectionId === 'string' ? a.sectionId : null,
          label: typeof a.label === 'string' ? a.label.slice(0, 40) : null,
        })),
    })
  } catch {
    // A failed guess is not a failed upload — sort with the rules alone.
    return NextResponse.json({ answers: [] })
  }
}
