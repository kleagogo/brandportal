import { getStorage } from './db'
import { getMeta, saveMeta } from './store'
import { normalizeEmail } from './users'

/**
 * The account's team — invited once, not once per hub.
 *
 * Editors were only ever a property of a single hub, so an agency with
 * twenty-five client spaces invited the same colleague twenty-five times, and
 * removing them when they left meant remembering all twenty-five.
 *
 * A member is stored against the owner's account, and their email is then
 * written into every one of that owner's hubs. That denormalisation is
 * deliberate: `canEditHub` is synchronous and sits on the hot path of every
 * page and API route, so resolving membership there would mean making the
 * whole chain async for a list that changes a handful of times a year.
 * Membership changes pay the cost instead, and the permission check stays
 * exactly as it was.
 */

interface MemberRecord {
  /** Emails on the account, lowercased. */
  emails: string[]
}

function key(ownerId: string): string {
  return `team:${ownerId}`
}

export async function listMembers(ownerId: string): Promise<string[]> {
  const rec = await getStorage().getJSON<MemberRecord>('app', key(ownerId))
  return rec?.emails || []
}

async function writeMembers(ownerId: string, emails: string[]): Promise<void> {
  await getStorage().putJSON('app', key(ownerId), { emails })
}

/** Every hub this account owns — where a member's access has to reach. */
async function ownedSlugs(ownerId: string): Promise<string[]> {
  const slugs = await getStorage().listKeys('hubs')
  const mine: string[] = []
  for (const slug of slugs) {
    const meta = await getMeta(slug)
    if (meta.ownerId === ownerId) mine.push(slug)
  }
  return mine
}

/**
 * Add someone to the account and to every hub it owns.
 *
 * Returns the member list. Adding someone already on it is not an error — the
 * caller usually can't tell, and the end state is the same either way.
 */
export async function addMember(ownerId: string, rawEmail: string): Promise<string[]> {
  const email = normalizeEmail(rawEmail)
  const emails = await listMembers(ownerId)
  if (!emails.includes(email)) {
    emails.push(email)
    await writeMembers(ownerId, emails)
  }

  for (const slug of await ownedSlugs(ownerId)) {
    const meta = await getMeta(slug)
    if (!meta.editors.includes(email)) {
      await saveMeta({ ...meta, editors: [...meta.editors, email] })
    }
  }
  return emails
}

/**
 * Take someone off the account and out of every hub it owns.
 *
 * This removes them from hubs they were invited to individually too. That is
 * the point: "remove from the team" has to mean they're gone, or the button
 * is worse than not having one.
 */
export async function removeMember(ownerId: string, rawEmail: string): Promise<string[]> {
  const email = normalizeEmail(rawEmail)
  const emails = (await listMembers(ownerId)).filter(e => e !== email)
  await writeMembers(ownerId, emails)

  for (const slug of await ownedSlugs(ownerId)) {
    const meta = await getMeta(slug)
    if (meta.editors.includes(email)) {
      await saveMeta({ ...meta, editors: meta.editors.filter(e => e !== email) })
    }
  }
  return emails
}

/** The editors a newly created hub starts with, so members don't wait for it. */
export async function editorsForNewHub(ownerId: string | null): Promise<string[]> {
  if (!ownerId) return []
  return listMembers(ownerId)
}
