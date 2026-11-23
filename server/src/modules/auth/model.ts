import Database from 'better-sqlite3'
import crypto from 'crypto'

export const USERNAME_MAX_ATTEMPTS = 5
export const USERNAME_WINDOW_MS = 5 * 60 * 1000
export const IP_MAX_ATTEMPTS = 20
export const IP_WINDOW_MS = 10 * 60 * 1000

export interface User {
  id: number
  name: string
  role: 'admin' | 'kasir' | 'dapur'
  pin_hash: string | null
  active: boolean
}

interface AttemptRecord {
  count: number
  firstAttempt: number
}

let db: Database.Database | null = null
const usernameAttempts = new Map<string, AttemptRecord>()
const ipAttempts = new Map<string, AttemptRecord>()

export function initDb(database: Database.Database) {
  db = database
}

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

export async function findUserByName(name: string): Promise<User | null> {
  const row = getDb().prepare('SELECT * FROM users WHERE name = ?').get(name) as User | undefined
  return row ?? null
}

export async function findUserById(id: number): Promise<User | null> {
  const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined
  return row ?? null
}

/** Hash PIN sebagai `saltHex:keyHex` pakai scrypt. Tidak ada dependensi baru. */
export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const key = crypto.scryptSync(pin, salt, 64).toString('hex')
  return `${salt}:${key}`
}

/** Verifikasi PIN terhadap hash `saltHex:keyHex` memakai perbandingan timing-safe. */
export function verifyPin(pin: string, storedHash: string | null): boolean {
  if (!storedHash || !storedHash.includes(':')) return false
  const [salt, key] = storedHash.split(':')
  if (!salt || !key) return false
  try {
    const derived = crypto.scryptSync(pin, salt, 64)
    const expected = Buffer.from(key, 'hex')
    if (expected.length !== derived.length) return false
    return crypto.timingSafeEqual(derived, expected)
  } catch {
    return false
  }
}

function record(map: Map<string, AttemptRecord>, key: string, windowMs: number): void {
  const now = Date.now()
  const rec = map.get(key)
  if (rec && now - rec.firstAttempt <= windowMs) {
    rec.count += 1
  } else {
    map.set(key, { count: 1, firstAttempt: now })
  }
}

function read(map: Map<string, AttemptRecord>, key: string, windowMs: number): { count: number; resetAt: number } {
  const rec = map.get(key)
  if (!rec) return { count: 0, resetAt: 0 }
  if (Date.now() - rec.firstAttempt > windowMs) {
    map.delete(key)
    return { count: 0, resetAt: 0 }
  }
  return { count: rec.count, resetAt: windowMs - (Date.now() - rec.firstAttempt) }
}

// --- Pembatasan per nama pengguna (berlaku juga untuk nama yang tidak ada) ---
export function recordUsernameFailure(name: string): void {
  record(usernameAttempts, name, USERNAME_WINDOW_MS)
}

export function getUsernameFailures(name: string): { count: number; resetAt: number } {
  return read(usernameAttempts, name, USERNAME_WINDOW_MS)
}

export function clearUsernameFailures(name: string): void {
  usernameAttempts.delete(name)
}

// --- Pembatasan per alamat IP ---
export function recordIpFailure(ip: string): void {
  record(ipAttempts, ip, IP_WINDOW_MS)
}

export function getIpFailures(ip: string): { count: number; resetAt: number } {
  return read(ipAttempts, ip, IP_WINDOW_MS)
}

export function clearIpFailures(ip: string): void {
  ipAttempts.delete(ip)
}

// Kompatibilitas nama lama dipakai beberapa tes.
export function recordLoginAttempt(userId: number): void {
  recordUsernameFailure(`user:${userId}`)
}

export function getLoginAttemptCount(userId: number): { count: number; resetAt: number } {
  return getUsernameFailures(`user:${userId}`)
}

export function clearLoginAttempts(userId: number): void {
  clearUsernameFailures(`user:${userId}`)
}

export async function createUser(
  name: string,
  role: 'admin' | 'kasir' | 'dapur',
  pin: string
): Promise<User> {
  const pinHash = hashPin(pin)
  const result = getDb()
    .prepare('INSERT INTO users (name, role, pin_hash, active) VALUES (?, ?, ?, 1)')
    .run(name, role, pinHash)

  return { id: Number(result.lastInsertRowid), name, role, pin_hash: pinHash, active: true }
}

/** Kosongkan state rate-limit in-memory (dipakai tes). */
export function resetAllAttempts(): void {
  usernameAttempts.clear()
  ipAttempts.clear()
}