/**
 * Dashboard vocabulary, by what the account is for.
 *
 * An agency and a single brand use the same product in the same way — one hub
 * holds your own brand, others hold more brands. Only the words differ, and a
 * startup being asked to file its own product under "client spaces" is enough
 * to make the app feel like it wasn't built for them. Nothing here changes
 * permissions or limits.
 */

import type { AccountType } from './users'

export interface HubLabels {
  /** Heading over the account's own hub. */
  ownHeading: string
  /** Heading over every other hub. */
  othersHeading: string
  /** Button that creates another hub. */
  newButton: string
  /** Placeholder in the name field for a new hub. */
  namePlaceholder: string
  /** Setup card, shown until the account has its own hub. */
  setupTitle: string
  setupBody: string
  setupAction: string
  setupPlaceholder: string
  /** Empty state under the others heading. */
  emptyTitle: string
  emptyBody: string
  /** One line on the own-hub card explaining what it does for the others. */
  ownCardNote: string
}

const AGENCY: HubLabels = {
  ownHeading: 'Your studio',
  othersHeading: 'Client spaces',
  newButton: '+ New client space',
  namePlaceholder: 'Client name',
  setupTitle: 'Start with your own brand',
  setupBody:
    'Your studio’s logo, colors, and type in one hub. Client links carry your studio’s name, and new client spaces copy this hub’s layout.',
  setupAction: 'Create studio hub',
  setupPlaceholder: 'Studio name',
  emptyTitle: 'No client spaces yet',
  emptyBody: 'One hub per client, each with its own address and share link.',
  ownCardNote: 'Your own brand. Client spaces copy its layout.',
}

const BRAND: HubLabels = {
  ownHeading: 'Your brand',
  othersHeading: 'Other spaces',
  newButton: '+ New space',
  namePlaceholder: 'Product or campaign',
  setupTitle: 'Start with your brand',
  setupBody:
    'Your logo, colors, and type in one hub. Send anyone who needs a file here.',
  setupAction: 'Create brand hub',
  setupPlaceholder: 'Brand name',
  emptyTitle: 'No other spaces yet',
  emptyBody: 'Add a space for a product line, a campaign, or a press kit.',
  ownCardNote: 'Your main brand. Other spaces copy its layout.',
}

export function labelsFor(accountType: AccountType | undefined | null): HubLabels {
  return accountType === 'brand' ? BRAND : AGENCY
}
