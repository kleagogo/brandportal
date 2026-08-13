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
export const PLANS: Record<'free' | 'pro', PlanLimits> = {
  free: { hubs: 25, editorsPerHub: 25 },
  pro: { hubs: 500, editorsPerHub: 200 },
}

export function limitsFor(user: User): PlanLimits {
  return PLANS[user.plan === 'pro' ? 'pro' : 'free']
}

export const UPGRADE_HINT = 'Early access includes 25 client spaces. Need more? Get in touch.'
