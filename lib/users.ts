/**
 * Users store — accounts are just an email address.
 * Stored as one JSON map ('app'/'users') through the storage driver.
 */

import crypto from 'crypto'
import { getStorage } from './db'

/**
 * What the account is for. An agency keeps a hub per client; a single brand
 * keeps one hub that is the product. It changes what the dashboard calls
 * things, not what anyone is allowed to do. Absent means never asked.
 */
export type AccountType = 'agency' | 'brand'

export interface User {
  id: string
  email: string
  createdAt: string
  /** Billing plan; absent means 'free'. Set by the Stripe webhook. */
  plan?: 'free' | 'pro'
  /** Stripe customer, so one person stays one record across upgrades. */
  stripeCustomerId?: string
  /** Stripe's own word for the subscription: active, past_due, canceled… */
  subscriptionStatus?: string
  /** When the current period ends — what "cancels on" means to a person. */
  subscriptionEndsAt?: string
  accountType?: AccountType
}

async function readUsers(): Promise<Record<string, User>> {
  return (await getStorage().getJSON<Record<string, User>>('app', 'users')) || {}
}

async function writeUsers(users: Record<string, User>): Promise<void> {
  await getStorage().putJSON('app', 'users', users)
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await readUsers()
  return users[id] || null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await readUsers()
  const norm = normalizeEmail(email)
  return Object.values(users).find(u => u.email === norm) || null
}

export async function updateUserEmail(id: string, newEmail: string): Promise<User | null> {
  const users = await readUsers()
  const user = users[id]
  if (!user) return null
  user.email = normalizeEmail(newEmail)
  await writeUsers(users)
  return user
}

export async function setAccountType(id: string, accountType: AccountType): Promise<User | null> {
  const users = await readUsers()
  const user = users[id]
  if (!user) return null
  user.accountType = accountType
  await writeUsers(users)
  return user
}

export async function deleteUser(id: string): Promise<void> {
  const users = await readUsers()
  delete users[id]
  await writeUsers(users)
}

/** Find or create the account for an email address. */
export async function ensureUser(email: string): Promise<User> {
  const existing = await getUserByEmail(email)
  if (existing) return existing
  const users = await readUsers()
  const user: User = {
    id: crypto.randomBytes(9).toString('base64url'),
    email: normalizeEmail(email),
    createdAt: new Date().toISOString(),
  }
  users[user.id] = user
  await writeUsers(users)
  return user
}

/** Record what Stripe told us about this account's subscription. */
export async function setBilling(
  id: string,
  patch: Partial<Pick<User, 'plan' | 'stripeCustomerId' | 'subscriptionStatus' | 'subscriptionEndsAt'>>
): Promise<User | null> {
  const users = await readUsers()
  const user = users[id]
  if (!user) return null
  users[id] = { ...user, ...patch }
  await writeUsers(users)
  return users[id]
}

/** Find an account by its Stripe customer — the id webhooks arrive with. */
export async function getUserByCustomerId(customerId: string): Promise<User | null> {
  const users = await readUsers()
  return Object.values(users).find(u => u.stripeCustomerId === customerId) || null
}
