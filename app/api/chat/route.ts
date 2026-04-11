import { NextRequest, NextResponse } from 'next/server'
import config from '../../../brand.config'

function buildSystemPrompt() {
  const colors = config.colors.flatMap(g => g.swatches.map(s => `${s.name}: ${s.hex}${s.usage ? ` (${s.usage})` : ''}`)).join(', ')
  const fonts = config.typography.flatMap(g => g.fonts.map(f => `${f.name} — ${f.role}`)).join(', ')
  const voice = config.guidelines.voice
  const principles = voice?.principles.map(p => `${p.name}: ${p.description}`).join('. ') || ''

  return `You are the Brand Agent for ${config.name}. You are an expert on this brand and help teammates, designers, and agencies use the brand correctly.

Brand overview:
- Name: ${config.name}
- Tagline: ${config.tagline}
- Website: ${config.website || 'Not specified'}

Colors: ${colors}

Typography: ${fonts}

Brand voice: ${principles}

Logo usage dos: ${config.guidelines.usage?.dos.join('; ') || 'Not specified'}
Logo usage don'ts: ${config.guidelines.usage?.donts.join('; ') || 'Not specified'}

Answer questions about the brand concisely and accurately. If asked for a specific color or asset, give the exact value. If you don't know something, say so honestly.`
}

export async function POST(req: NextRequest) {
  const { message } = await req.json()
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      reply: "The Brand Agent needs an Anthropic API key to work. Add ANTHROPIC_API_KEY to your .env.local file.",
    })
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: config.agent.model,
      max_tokens: 400,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: message }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ reply: text })
  } catch {
    return NextResponse.json({ reply: 'Something went wrong. Please try again.' })
  }
}
