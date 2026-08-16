/**
 * Typed seam over the vendored transitions.dev components.
 *
 * The files beside this one are unchecked on purpose (see their banner). This
 * module is where the app's side of the contract is declared, so every call
 * site is typechecked even though the recipe internals aren't. If a recipe
 * update changes a prop, the error surfaces here rather than at runtime.
 *
 * Signatures below were read off the vendored source, not assumed — six of them
 * differ from what the docs implied.
 */

import type { CSSProperties, ReactNode, RefObject } from 'react'

import { CardStack as CardStackImpl } from './CardStack'
import { GooeyPlusMenu as GooeyPlusMenuImpl } from './GooeyPlusMenu'
import { GradientText as GradientTextImpl } from './GradientText'
import { ImageOpenTilt as ImageOpenTiltImpl } from './ImageOpenTilt'
import { OrganicShimmer as OrganicShimmerImpl } from './OrganicShimmer'
import { StatusBadge as StatusBadgeImpl } from './StatusBadge'
import { useConfettiBurst as useConfettiBurstImpl } from './ConfettiBurst'
import { useDragDrop as useDragDropImpl } from './DropPhysics'
import { useSmokyDissolve as useSmokyDissolveImpl } from './SmokyDissolve'

type Ref<T> = RefObject<T | null>

/** spinner-check-morph — a 22px badge that spins, then resolves into a check. */
export const StatusBadge = StatusBadgeImpl as (props: {
  state?: 'loading' | 'done'
  label?: string
}) => ReactNode

/** card-stack-hover — stacked cards that fan out on container hover. */
export interface StackSlot {
  cx: string
  cy: string
  rot: string
  dx: string
  dy: string
  drot: string
  content?: ReactNode
}
export const CardStack = CardStackImpl as (props: { slots?: StackSlot[] }) => ReactNode

/** organic-shimmer — a coloured skeleton sweep for a surface that's working. */
export const OrganicShimmer = OrganicShimmerImpl as (props: {
  width?: number
  height?: number
  radius?: number
  playing?: boolean
}) => ReactNode

/** pro-gradient-text — a living gradient clipped to one word's glyphs. */
export const GradientText = GradientTextImpl as (props: {
  children: ReactNode
  as?: keyof HTMLElementTagNameMap
  hueDur?: string
  driftDur?: string
  style?: CSSProperties
  className?: string
}) => ReactNode

/** image-open-tilt — iPadOS-style 3D zoom. Owns its own open state. */
export const ImageOpenTilt = ImageOpenTiltImpl as (props: {
  src: string
  alt?: string
}) => ReactNode

/**
 * gooey-plus-menu — a plus that liquid-splits into satellite actions.
 *
 * `fx`/`fy` are required in practice, not optional: each satellite's fanned
 * position comes from them as custom properties, so an item without them lands
 * back under the plus and the menu looks broken while reporting itself open.
 */
export interface GooeyItem {
  id: string
  label: string
  /** Fanned offset from the plus, e.g. '-54px'. */
  fx: string
  fy: string
  icon?: ReactNode
}
export const GooeyPlusMenu = GooeyPlusMenuImpl as (props: {
  items?: GooeyItem[]
  onSelect?: (item: GooeyItem) => void
}) => ReactNode

/** confetti-burst — flakes that fall and collide with the trigger button. */
export const useConfettiBurst = useConfettiBurstImpl as (
  stageRef: Ref<HTMLElement>,
  canvasRef: Ref<HTMLCanvasElement>,
  buttonRef: Ref<HTMLElement>,
) => () => void

/** drag-drop-physics — weighted drag; the zone squashes and puffs on landing. */
export const useDragDrop = useDragDropImpl as (
  chipRef: Ref<HTMLElement>,
  zoneRef: Ref<HTMLElement>,
  puffsRef: Ref<SVGGElement>,
  opts?: { onDrop?: () => void },
) => void

/** smoky-dissolve — a tile that shreds into smoke and sinks when removed. */
export const useSmokyDissolve = useSmokyDissolveImpl as (
  stageRef: Ref<HTMLElement>,
  cardRef: Ref<HTMLElement>,
  canvasRef: Ref<HTMLCanvasElement>,
  opts?: { onDone?: () => void },
) => () => void

/** Convenience wrapper around smoky-dissolve — see SmokyTile.tsx. */
export { SmokyTile } from './SmokyTile'

/** Wiring for the free recipes — see motion.tsx. */
export { useModalTransition, TextSwap, IconSwap, Toggle } from './motion'
