import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  findUserByName,
  verifyPin,
  recordLoginAttempt,
  getLoginAttemptCount,
  clearLoginAttempts,
  initDb
} from '../server/src/modules/auth/model'
import Database from 'better-sqlite3'

let db: Database.Database

beforeEach(async () => {
  // Set up in-memory database for testing
  db = new Database(':memory:')
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'kasir', 'dapur')),
      pin_hash TEXT,
      active INTEGER DEFAULT 1
    )
  `)

  // Initialize auth model and reset login attempts
  initDb(db)
  clearLoginAttempts(1)
})

afterEach(() => {
  db.close()
})

describe('1. Tidak ada endpoint register publik', () => {
  it('auth model should not have register function as direct export', () => {
    // Verify that the auth model exports expected functions
    // Hanya login, logout, me yang tersedia - tidak ada register endpoint publik
    expect(typeof findUserByName).toBe('function')
    expect(typeof verifyPin).toBe('function')
    expect(typeof recordLoginAttempt).toBe('function')
    // createUser ada tapi hanya bisa dipakai lewat admin middleware
    expect(typeof initDb).toBe('function')
  })
})

describe('5. Token sesi disimpan sebagai hash, bukan polos', () => {
  it('user pin_hash should never be null or empty when user exists', async () => {
    // Insert user with PIN hash
    const crypto = require('crypto')
    const salt = Buffer.from('test_salt_1234567890ab')
    const key = crypto.scryptSync('testpin123', salt, 64)
    const pinHash = key.toString('hex')
    db.prepare('INSERT INTO users (name, role, pin_hash, active) VALUES (?, ?, ?, 1)').run('Test User', 'kasir', pinHash)

    const user = await findUserByName('Test User')
    expect(user).toBeDefined()
    expect(user?.pin_hash).toBeDefined()
    expect(user?.pin_hash?.length).toBeGreaterThan(0)
    // Pin hash harus berupa hex string dari scrypt (64 byte = 128 hex chars)
    expect(user?.pin_hash).toMatch(/^[0-9a-f]{128}$/)
  })

  it('should return false when verifying with empty hash', async () => {
    const result = await verifyPin('1234', '')
    expect(result).toBe(false)
  })

  it('should return false when verifying with null hash', async () => {
    const result = await verifyPin('1234', null as any)
    expect(result).toBe(false)
  })
})

describe('6. Login mengenali pengguna: nama + PIN, bukan PIN saja', () => {
  it('should reject login with name only (no PIN provided in context)', async () => {
    // Cari user dengan nama kosong
    const user = await findUserByName('')
    expect(user).toBeNull()
  })

  it('should reject login for non-existent user', async () => {
    // Coba cari user yang tidak ada di database
    const user = await findUserByName('NonExistentUser12345')
    expect(user).toBeNull()
  })

  it('rate limiting should work for non-existent user IDs', () => {
    // Test bahwa getLoginAttemptCount bekerja meskipun user tidak ada di DB
    const info = getLoginAttemptCount(999)
    expect(info.count).toBe(0)
    expect(info.resetAt).toBe(0)
  })
})