'use client'

import { CardStack, type StackSlot } from '../components/transitions'

/** Resting and fanned poses from the recipe, one per card in the stack. */
const POSES: Array<Omit<StackSlot, 'content'>> = [
  { cx: '28px', cy: '20px', rot: '4deg', dx: '2px', dy: '-26px', drot: '7deg' },
  { cx: '12px', cy: '20px', rot: '-8deg', dx: '-4px', dy: '-6px', drot: '-7deg' },
  { cx: '21px', cy: '26px', rot: '0deg', dx: '2px', dy: '26px', drot: '4deg' },
]

/**
 * The dashboard card's thumbnail: what's actually inside the space.
 *
 * With three or more images it becomes a fanning stack. Below that a stack reads
 * as broken rather than restrained, so one image falls back to a plain thumbnail
 * and an empty space keeps its initial — the card still has to work on day one,
 * when there is nothing in the hub at all.
 */
export function HubCardStack({
  images,
  logoUrl,
  fallback,
}: {
  images: string[]
  logoUrl?: string
  fallback: string
}) {
  if (images.length >= 3) {
    const slots: StackSlot[] = POSES.map((pose, i) => ({
      ...pose,
      content: (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={images[i]} alt="" className="w-full h-full object-cover" />
      ),
    }))
    // The fan needs about 106px of vertical room at full size; the card's
    // thumbnail strip is 96px and clips, so the stack is scaled to fit inside
    // it rather than the strip being grown — the card grid keeps its rhythm.
    return (
      <div className="scale-[0.5]">
        <CardStack slots={slots} />
      </div>
    )
  }

  const single = images[0] || logoUrl
  if (single) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={single} alt="" className="max-h-full max-w-full object-contain" />
  }

  return (
    <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-[15px]">
      {fallback}
    </div>
  )
}
