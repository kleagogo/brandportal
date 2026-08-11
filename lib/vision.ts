/**
 * AI assist for uploads — Claude suggests a name, tags, and a usage note.
 *
 * Best-effort in every direction: no API key, an unsupported format, or any
 * failure simply means the upload keeps its filename.
 */

export interface AssetSuggestion {
  name: string
  tags: string[]
  usage: string
}

const VISION_TYPES: Record<string, 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif',
}

/** Vision only reads images, and only ones small enough to be worth sending. */
const INLINE_LIMIT = 4 * 1024 * 1024

type Source =
  | { kind: 'buffer'; buffer: Buffer; ext: string }
  | { kind: 'url'; url: string; ext: string }

export async function describeAsset(source: Source, originalName: string): Promise<AssetSuggestion | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  const mediaType = VISION_TYPES[source.ext]
  if (!mediaType) return null
  if (source.kind === 'buffer' && source.buffer.length > INLINE_LIMIT) return null

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const image = source.kind === 'buffer'
      ? { type: 'base64' as const, media_type: mediaType, data: source.buffer.toString('base64') }
      : { type: 'url' as const, url: source.url }

    const response = await client.messages.create(
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: image },
            { type: 'text', text: `This file ("${originalName}") was uploaded to a brand asset hub. Return ONLY JSON: {"name":"short human title","tags":["3-5 lowercase tags"],"usage":"one short sentence on when to use this asset"}` },
          ],
        }],
      },
      { timeout: 8000 }
    )
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const parsed = JSON.parse(text.match(/\{[\s\S]+\}/)?.[0] || '')
    if (typeof parsed.name !== 'string' || !Array.isArray(parsed.tags)) return null
    return {
      name: parsed.name.slice(0, 60),
      tags: parsed.tags.filter((t: unknown) => typeof t === 'string').slice(0, 5),
      usage: typeof parsed.usage === 'string' ? parsed.usage.slice(0, 120) : '',
    }
  } catch {
    return null
  }
}
