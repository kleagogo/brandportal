/**
 * Users store — accounts are just an email address.
 * Stored as one JSON map ('app'/'users') through the storage driver.
 */

import crypto from 'crypto'
import { getStorage } from './db'

export interface User {
  id: string
  email: string
  createdAt: string
  /** Billing plan; absent means 'free'. Pro isn't purchasable yet. */
  plan?: 'free' | 'pro'
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
