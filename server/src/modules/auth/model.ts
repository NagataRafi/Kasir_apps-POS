import Database from 'better-sqlite3'
import { open } from 'sqlite'
import crypto from 'crypto'
import path from 'path'

const FIVE_MINUTES_MS = 5 * 60 * 1000
const MAX_ATTEMPTS = 5

export interface User {
  id: number
  name: string
  role: 'admin' | 'kasir' | 'dapur'
  pin_hash: string | null
  active: boolean
}

export interface LoginAttempt {
  userId: number
  count: number
  firstAttempt: number
}

let db: Database.Database | null = null
let loginAttempts: Map<number, LoginAttempt> = new Map()

export function initDb(database: Database.Database) {
  db = database
}

export async function findUserByName(name: string): Promise<User | null> {
  if (!db) throw new Error('Database not initialized')
  const row = db.prepare('SELECT * FROM users WHERE name = ?').get(name) as User | undefined
  return row || null
}

export async function findUserById(id: number): Promise<User | null> {
  if (!db) throw new Error('Database not initialized')
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined
  return row || null
}

export async function verifyPin(enteredPin: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false
  return new Promise((resolve) => {
    crypto.scrypt(enteredPin, storedHash.slice(0, 16), 64, (err, derivedKey) => {
      if (err) return resolve(false)
      resolve(derivedKey.toString('hex') === storedHash)
    })
  })
}

export function recordLoginAttempt(userId: number): void {
  const now = Date.now()
  const attempt = loginAttempts.get(userId)

  if (attempt) {
    if (now - attempt.firstAttempt > FIVE_MINUTES_MS) {
      // Reset window
      loginAttempts.set(userId, { userId, count: 1, firstAttempt: now })
    } else {
      attempt.count += 1
      loginAttempts.set(userId, attempt)
    }
  } else {
    loginAttempts.set(userId, { userId, count: 1, firstAttempt: now })
  }
}

export function getLoginAttemptCount(userId: number): { count: number, resetAt: number } {
  const attempt = loginAttempts.get(userId)
  if (!attempt) return { count: 0, resetAt: 0 }
  const remaining = Math.max(0, FIVE_MINUTES_MS - (Date.now() - attempt.firstAttempt))
  return { count: attempt.count, resetAt: remaining }
}

export function clearLoginAttempts(userId: number): void {
  loginAttempts.delete(userId)
}

export async function createUser(
  name: string,
  role: 'admin' | 'kasir' | 'dapur',
  pin: string
): Promise<User> {
  if (!db) throw new Error('Database not initialized')

  // Hash PIN with scrypt
  const salt = crypto.randomBytes(16).toString('hex')
  const key = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(pin, salt, 64, (err, key) => {
      if (err) reject(err)
      else resolve(key)
    })
  })

  const pinHash = key.toString('hex')

  const result = db.prepare(
    `INSERT INTO users (name, role, pin_hash, active) VALUES (?, ?, ?, 1)`
  ).run(name, role, pinHash)

  return {
    id: result.lastInsertRowid,
    name,
    role,
    pin_hash: pinHash,
    active: true
  }
}