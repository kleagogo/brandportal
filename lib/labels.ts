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
    'Put your studio’s logo, colors, type and photography in a hub first. You’ll know the product before a client sees it, every client link you share gets signed with your studio’s name and color, and each client space you set up copies this hub’s layout.',
  setupAction: 'Create studio hub',
  setupPlaceholder: 'Studio name',
  emptyTitle: 'No client spaces yet',
  emptyBody: 'One per client — each gets its own brand hub, its own address, and its own share link.',
  ownCardNote: 'Your own brand. Client spaces copy its layout; client links carry its name and color.',
}

const BRAND: HubLabels = {
  ownHeading: 'Your brand',
  othersHeading: 'Other spaces',
  newButton: '+ New space',
  namePlaceholder: 'Product or campaign',
  setupTitle: 'Start with your brand',
  setupBody:
    'Put your logo, colors, type and photography in one hub. It becomes the place you send anyone who needs a file — teammates, freelancers, press, printers — and the layout you set here carries to any other space you add.',
  setupAction: 'Create brand hub',
  setupPlaceholder: 'Brand name',
  emptyTitle: 'No other spaces yet',
  emptyBody: 'Add one for a product line, a campaign, or a press kit — each with its own address and share link.',
  ownCardNote: 'Your main brand. Other spaces copy its layout; share links carry its name and color.',
}

export function labelsFor(accountType: AccountType | undefined | null): HubLabels {
  return accountType === 'brand' ? BRAND : AGENCY
}
