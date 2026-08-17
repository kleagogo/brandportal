import { NextRequest, NextResponse } from 'next/server'
import { canViewHub, getHub, getMeta } from '@/lib/store'
import { allow, clientIp } from '@/lib/ratelimit'
import { getSessionUser } from '@/lib/auth'
import type { BrandConfig } from '@/app/types/brand'

function buildSystemPrompt(config: BrandConfig) {
  const colors = config.colors.flatMap(g => g.swatches.map(s => `${s.name}: ${s.hex}${s.usage ? ` (${s.usage})` : ''}`)).join(', ')
  const fonts = config.typography.flatMap(g => g.fonts.map(f => `${f.name} — ${f.role}`)).join(', ')
  const voice = config.guidelines.voice
  const principles = voice?.principles.map(p => `${p.name}: ${p.description}`).join('. ') || ''
  const assets = Object.entries(config.assets)
    .flatMap(([section, files]) => files.map(a => `${a.name} (${section}${a.tags?.length ? `, tags: ${a.tags.join('/')}` : ''})`))
    .join(', ')

  return `You are the Brand Agent for ${config.name}. You are an expert on this brand and help teammates, designers, and agencies use the brand correctly.

Brand overview:
- Name: ${config.name}
- Tagline: ${config.tagline}
- Website: ${config.website || 'Not specified'}

Colors: ${colors}

Typography: ${fonts}

Available assets: ${assets || 'None uploaded yet'}

Brand voice: ${principles}

Logo usage dos: ${config.guidelines.usage?.dos.join('; ') || 'Not specified'}
Logo usage don'ts: ${config.guidelines.usage?.donts.join('; ') || 'Not specified'}

Answer questions about the brand concisely and accurately. If asked for a specific color or asset, give the exact value. If you don't know something, say so honestly.`
}

export async function POST(req: NextRequest) {
  const { message, slug } = await req.json()
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  // Each hub's agent answers from THAT hub's data.
  const hubSlug = typeof slug === 'string' ? slug : ''
  const config = await getHub(hubSlug)
  if (!config) return NextResponse.json({ error: 'Hub not found' }, { status: 404 })

  // The prompt below contains the whole brand — colours, voice, every asset
  // name. Answering without checking is the PIN gate leaking through a chat
  // box, so ask exactly what the hub page asks.
  const meta = await getMeta(hubSlug)
  if (!(await canViewHub(hubSlug, meta, await getSessionUser()))) {
    return NextResponse.json({ error: 'This hub is locked' }, { status: 401 })
  }

  // The public demo needs no sign-in, so its Brand Agent would be an open,
  // billable endpoint — and the rate limiter counts per Worker isolate, which
  // barely holds under real traffic. Answer without calling the model.
  if (meta.demo) {
    return NextResponse.json({
      reply: `The Brand Agent answers from a hub's own colors, type, and files, so it runs in your hub rather than in this shared demo. Start a free hub and it'll know your brand.`,
    })
  }

  if (!allow(`chat:${clientIp(req)}`, 30, 60 * 60_000)) {
    return NextResponse.json({ reply: 'The Brand Agent is taking a breather. Try again in a little while.' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      reply: 'The Brand Agent needs an Anthropic API key to work. Add ANTHROPIC_API_KEY to your .env.local file.',
    })
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: config.agent.model,
      max_tokens: 400,
      system: buildSystemPrompt(config),
      messages: [{ role: 'user', content: message }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ reply: text })
  } catch {
    return NextResponse.json({ reply: 'Something went wrong. Please try again.' })
  }
}
