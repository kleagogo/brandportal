/**
 * Plan limits — the shape of Free vs Pro, enforced server-side.
 * Pro isn't purchasable yet; users default to 'free' and the demo hub is exempt.
 */

import type { User } from './users'

export interface PlanLimits {
  hubs: number
  editorsPerHub: number
}

export const PLANS: Record<'free' | 'pro', PlanLimits> = {
  free: { hubs: 1, editorsPerHub: 2 },
  pro: { hubs: 3, editorsPerHub: 10 },
}

export function limitsFor(user: User): PlanLimits {
  return PLANS[user.plan === 'pro' ? 'pro' : 'free']
}

export const UPGRADE_HINT = 'Free includes 1 hub. Pro (coming soon) raises the limits.'
