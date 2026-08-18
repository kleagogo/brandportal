/**
 * A bundled slice of Google Fonts, most-used first within each bucket.
 *
 * The full catalogue is ~1,800 families behind an API key. The picker doesn't
 * need the catalogue — it needs the families that cover almost every brand
 * deck, offline and instantly, with free-text still accepted for the rest:
 * any Google family loads by name alone, so typing "Fraunces" works whether
 * or not it's listed here.
 *
 * `weights` is each family's real coverage, and it matters more than it
 * looks: the stylesheet endpoint rejects the whole request when any asked-for
 * weight doesn't exist, so guessing 400+600 for a single-weight display face
 * like Bebas Neue used to mean the font didn't load at all.
 */
export interface GoogleFont {
  name: string
  category: 'Sans serif' | 'Serif' | 'Display' | 'Mono'
  /** The weights this family actually offers on Google Fonts. */
  weights: string[]
}

const span = (from: number, to: number) => {
  const out: string[] = []
  for (let w = from; w <= to; w += 100) out.push(String(w))
  return out
}

export const GOOGLE_FONTS: GoogleFont[] = [
  { name: 'Inter', category: 'Sans serif', weights: span(100, 900) },
  { name: 'Roboto', category: 'Sans serif', weights: span(100, 900) },
  { name: 'Open Sans', category: 'Sans serif', weights: span(300, 800) },
  { name: 'Montserrat', category: 'Sans serif', weights: span(100, 900) },
  { name: 'Poppins', category: 'Sans serif', weights: span(100, 900) },
  { name: 'Lato', category: 'Sans serif', weights: ['100', '300', '400', '700', '900'] },
  { name: 'Manrope', category: 'Sans serif', weights: span(200, 800) },
  { name: 'Work Sans', category: 'Sans serif', weights: span(100, 900) },
  { name: 'DM Sans', category: 'Sans serif', weights: span(100, 900) },
  { name: 'Plus Jakarta Sans', category: 'Sans serif', weights: span(200, 800) },
  { name: 'Figtree', category: 'Sans serif', weights: span(300, 900) },
  { name: 'Outfit', category: 'Sans serif', weights: span(100, 900) },
  { name: 'Sora', category: 'Sans serif', weights: span(100, 800) },
  { name: 'Space Grotesk', category: 'Sans serif', weights: span(300, 700) },
  { name: 'Onest', category: 'Sans serif', weights: span(100, 900) },
  { name: 'Nunito', category: 'Sans serif', weights: span(200, 900) },
  { name: 'Nunito Sans', category: 'Sans serif', weights: span(200, 900) },
  { name: 'Raleway', category: 'Sans serif', weights: span(100, 900) },
  { name: 'Rubik', category: 'Sans serif', weights: span(300, 900) },
  { name: 'Karla', category: 'Sans serif', weights: span(200, 800) },
  { name: 'Mulish', category: 'Sans serif', weights: span(200, 900) },
  { name: 'Barlow', category: 'Sans serif', weights: span(100, 900) },
  { name: 'Source Sans 3', category: 'Sans serif', weights: span(200, 900) },
  { name: 'IBM Plex Sans', category: 'Sans serif', weights: span(100, 700) },
  { name: 'Albert Sans', category: 'Sans serif', weights: span(100, 900) },
  { name: 'Instrument Sans', category: 'Sans serif', weights: span(400, 700) },
  { name: 'Schibsted Grotesk', category: 'Sans serif', weights: span(400, 900) },
  { name: 'Urbanist', category: 'Sans serif', weights: span(100, 900) },
  { name: 'Lexend', category: 'Sans serif', weights: span(100, 900) },
  { name: 'Archivo', category: 'Sans serif', weights: span(100, 900) },

  { name: 'Playfair Display', category: 'Serif', weights: span(400, 900) },
  { name: 'Lora', category: 'Serif', weights: span(400, 700) },
  { name: 'Merriweather', category: 'Serif', weights: span(300, 900) },
  { name: 'Libre Baskerville', category: 'Serif', weights: ['400', '700'] },
  { name: 'Cormorant Garamond', category: 'Serif', weights: span(300, 700) },
  { name: 'EB Garamond', category: 'Serif', weights: span(400, 800) },
  { name: 'Crimson Pro', category: 'Serif', weights: span(200, 900) },
  { name: 'Fraunces', category: 'Serif', weights: span(100, 900) },
  { name: 'DM Serif Display', category: 'Serif', weights: ['400'] },
  { name: 'Newsreader', category: 'Serif', weights: span(200, 800) },
  { name: 'Source Serif 4', category: 'Serif', weights: span(200, 900) },
  { name: 'Spectral', category: 'Serif', weights: span(200, 800) },
  { name: 'Bitter', category: 'Serif', weights: span(100, 900) },
  { name: 'Zilla Slab', category: 'Serif', weights: span(300, 700) },
  { name: 'Instrument Serif', category: 'Serif', weights: ['400'] },

  { name: 'Bricolage Grotesque', category: 'Display', weights: span(200, 800) },
  { name: 'Unbounded', category: 'Display', weights: span(200, 900) },
  { name: 'Bebas Neue', category: 'Display', weights: ['400'] },
  { name: 'Anton', category: 'Display', weights: ['400'] },
  { name: 'Abril Fatface', category: 'Display', weights: ['400'] },
  { name: 'Righteous', category: 'Display', weights: ['400'] },
  { name: 'Syne', category: 'Display', weights: span(400, 800) },

  { name: 'JetBrains Mono', category: 'Mono', weights: span(100, 800) },
  { name: 'Fira Code', category: 'Mono', weights: span(300, 700) },
  { name: 'IBM Plex Mono', category: 'Mono', weights: span(100, 700) },
  { name: 'Space Mono', category: 'Mono', weights: ['400', '700'] },
  { name: 'DM Mono', category: 'Mono', weights: ['300', '400', '500'] },
]

/** The short shelf shown before anyone types — one taste of each bucket. */
export const FEATURED_FONTS = [
  'Inter', 'Manrope', 'Space Grotesk', 'Playfair Display',
  'Fraunces', 'Bricolage Grotesque', 'Bebas Neue', 'JetBrains Mono',
]
