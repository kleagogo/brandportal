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

export const PLANS: Record<'free' | 'pro', PlanLimits> = {
  free: { hubs: 2, editorsPerHub: 3 },
  pro: { hubs: 10, editorsPerHub: 25 },
}

export function limitsFor(user: User): PlanLimits {
  return PLANS[user.plan === 'pro' ? 'pro' : 'free']
}

export const UPGRADE_HINT = 'Free includes 2 client spaces. Studio raises it to 10.'
