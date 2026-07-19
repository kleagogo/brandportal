/**
 * Users store — accounts are just an email address.
 * Stored as a single JSON map in data/users.json (a table row later).
 */

import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

export interface User {
  id: string
  email: string
  createdAt: string
}

async function readUsers(): Promise<Record<string, User>> {
  try {
    return JSON.parse(await fs.readFile(USERS_FILE, 'utf8'))
  } catch {
    return {}
  }
}

async function writeUsers(users: Record<string, User>): Promise<void> {
  await fs.mkdir(path.dirname(USERS_FILE), { recursive: true })
  const tmp = `${USERS_FILE}.tmp`
  await fs.writeFile(tmp, JSON.stringify(users, null, 2), 'utf8')
  await fs.rename(tmp, USERS_FILE)
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
