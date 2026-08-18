/**
 * A bundled slice of Google Fonts, most-used first within each bucket.
 *
 * The full catalogue is ~1,800 families behind an API key. The picker doesn't
 * need the catalogue — it needs the sixty families that cover almost every
 * brand deck, offline and instantly, with free-text still accepted for the
 * rest: any Google family loads by name alone, so typing "Fraunces" works
 * whether or not it's listed here.
 */
export interface GoogleFont {
  name: string
  category: 'Sans serif' | 'Serif' | 'Display' | 'Mono'
}

export const GOOGLE_FONTS: GoogleFont[] = [
  { name: 'Inter', category: 'Sans serif' },
  { name: 'Roboto', category: 'Sans serif' },
  { name: 'Open Sans', category: 'Sans serif' },
  { name: 'Montserrat', category: 'Sans serif' },
  { name: 'Poppins', category: 'Sans serif' },
  { name: 'Lato', category: 'Sans serif' },
  { name: 'Manrope', category: 'Sans serif' },
  { name: 'Work Sans', category: 'Sans serif' },
  { name: 'DM Sans', category: 'Sans serif' },
  { name: 'Plus Jakarta Sans', category: 'Sans serif' },
  { name: 'Figtree', category: 'Sans serif' },
  { name: 'Outfit', category: 'Sans serif' },
  { name: 'Sora', category: 'Sans serif' },
  { name: 'Space Grotesk', category: 'Sans serif' },
  { name: 'Onest', category: 'Sans serif' },
  { name: 'Nunito', category: 'Sans serif' },
  { name: 'Nunito Sans', category: 'Sans serif' },
  { name: 'Raleway', category: 'Sans serif' },
  { name: 'Rubik', category: 'Sans serif' },
  { name: 'Karla', category: 'Sans serif' },
  { name: 'Mulish', category: 'Sans serif' },
  { name: 'Barlow', category: 'Sans serif' },
  { name: 'Source Sans 3', category: 'Sans serif' },
  { name: 'IBM Plex Sans', category: 'Sans serif' },
  { name: 'Albert Sans', category: 'Sans serif' },
  { name: 'Instrument Sans', category: 'Sans serif' },
  { name: 'Schibsted Grotesk', category: 'Sans serif' },
  { name: 'Urbanist', category: 'Sans serif' },
  { name: 'Lexend', category: 'Sans serif' },
  { name: 'Archivo', category: 'Sans serif' },

  { name: 'Playfair Display', category: 'Serif' },
  { name: 'Lora', category: 'Serif' },
  { name: 'Merriweather', category: 'Serif' },
  { name: 'Libre Baskerville', category: 'Serif' },
  { name: 'Cormorant Garamond', category: 'Serif' },
  { name: 'EB Garamond', category: 'Serif' },
  { name: 'Crimson Pro', category: 'Serif' },
  { name: 'Fraunces', category: 'Serif' },
  { name: 'DM Serif Display', category: 'Serif' },
  { name: 'Newsreader', category: 'Serif' },
  { name: 'Source Serif 4', category: 'Serif' },
  { name: 'Spectral', category: 'Serif' },
  { name: 'Bitter', category: 'Serif' },
  { name: 'Zilla Slab', category: 'Serif' },
  { name: 'Instrument Serif', category: 'Serif' },

  { name: 'Bricolage Grotesque', category: 'Display' },
  { name: 'Unbounded', category: 'Display' },
  { name: 'Clash Display', category: 'Display' },
  { name: 'Bebas Neue', category: 'Display' },
  { name: 'Anton', category: 'Display' },
  { name: 'Abril Fatface', category: 'Display' },
  { name: 'Righteous', category: 'Display' },
  { name: 'Syne', category: 'Display' },

  { name: 'JetBrains Mono', category: 'Mono' },
  { name: 'Fira Code', category: 'Mono' },
  { name: 'IBM Plex Mono', category: 'Mono' },
  { name: 'Space Mono', category: 'Mono' },
  { name: 'DM Mono', category: 'Mono' },
]

export const FONT_CATEGORIES = ['Sans serif', 'Serif', 'Display', 'Mono'] as const
