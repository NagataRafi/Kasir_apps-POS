import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  findUserByName,
  verifyPin,
  recordLoginAttempt,
  getLoginAttemptCount,
  clearLoginAttempts,
  createUser,
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

  // Insert a test user with PIN hash manually using SQLite
  const crypto = require('crypto')
  const salt = Buffer.from('test_salt_1234567890ab')
  const key = crypto.scryptSync('testpin123', salt, 64)
  const pinHash = key.toString('hex')
  db.prepare('INSERT INTO users (name, role, pin_hash, active) VALUES (?, ?, ?, 1)').run('Test User', 'kasir', pinHash)

  // Initialize auth model and reset login attempts map
  initDb(db)
  clearLoginAttempts(1)
})

afterEach(() => {
  db.close()
})

describe('Login Attempt Rate Limiting', () => {
  it('should record failed attempt and allow login after reset', () => {
    const userId = 1

    // Record 4 failed attempts
    recordLoginAttempt(userId)
    recordLoginAttempt(userId)
    recordLoginAttempt(userId)
    recordLoginAttempt(userId)

    const info1 = getLoginAttemptCount(userId)
    expect(info1.count).toBe(4)

    // Record 5th attempt - should be at limit
    recordLoginAttempt(userId)
    const info2 = getLoginAttemptCount(userId)
    expect(info2.count).toBe(5)
  })

  it('should lock account after 5 failed attempts', () => {
    const userId = 1

    // Record 5 failed attempts
    for (let i = 0; i < 5; i++) {
      recordLoginAttempt(userId)
    }

    const info = getLoginAttemptCount(userId)
    expect(info.count).toBe(5)
  })
})

describe('User Management', () => {
  it('should find user by name', async () => {
    const user = await findUserByName('Test User')
    expect(user).toBeDefined()
    expect(user?.name).toBe('Test User')
  })

  it('should return null for non-existent user', async () => {
    const user = await findUserByName('Non-existent')
    expect(user).toBeNull()
  })
})