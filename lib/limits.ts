/**
 * Plan limits — client spaces per plan, matching the pricing page.
 * Pro/Studio isn't purchasable yet; users default to 'free'.
 */

import type { User } from './users'

export interface PlanLimits {
  /** Client spaces (one brand hub each). */
  hubs: number
  editorsPerHub: number
}

/**
 * Early access: the free tier is deliberately generous so the first agencies
 * can put their whole roster in without hitting a wall. Tighten when billing
 * exists — see the pricing page, which advertises the same numbers.
 */
/**
 * Free stays at the early-access numbers the pricing page advertises;
 * tightening it is a launch decision, not a code one. Founding ($19) matches
 * it — what the $19 buys today is the founding price lock and the product's
 * future — and Studio ($49) is the tier with room: an agency's whole roster.
 */
export const PLANS: Record<'free' | 'pro' | 'studio', PlanLimits> = {
  free: { hubs: 25, editorsPerHub: 25 },
  pro: { hubs: 25, editorsPerHub: 25 },
  studio: { hubs: 500, editorsPerHub: 200 },
}

export function limitsFor(user: User): PlanLimits {
  return PLANS[user.plan === 'pro' || user.plan === 'studio' ? user.plan : 'free']
}

export const UPGRADE_HINT = 'Early access includes 25 client spaces. Need more? Get in touch.'
