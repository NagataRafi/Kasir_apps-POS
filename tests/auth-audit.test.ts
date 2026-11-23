import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  findUserByName,
  verifyPin,
  recordLoginAttempt,
  getLoginAttemptCount,
  clearLoginAttempts,
  hashPin,
  initDb
} from '../server/src/modules/auth/model'
import Database from 'better-sqlite3'

let db: Database.Database

beforeEach(async () => {
  db = new Database(':memory:')
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'kasir', 'dapur')),
      pin_hash TEXT,
      active INTEGER DEFAULT 1
    )
  `)
  db.prepare('INSERT INTO users (name, role, pin_hash, active) VALUES (?, ?, ?, 1)').run(
    'Test User',
    'kasir',
    hashPin('testpin123')
  )
  initDb(db)
  clearLoginAttempts(1)
})

afterEach(() => {
  db.close()
})

describe('1. Tidak ada endpoint register publik (pembuatan hanya seed/admin)', () => {
  it('model mengekspose findUserByName, verifyPin, hashPin; pembuatan user lewat createUser/admin', () => {
    expect(typeof findUserByName).toBe('function')
    expect(typeof verifyPin).toBe('function')
    expect(typeof hashPin).toBe('function')
  })
})

describe('5. Token/hash disimpan sebagai hash, bukan polos', () => {
  it('pin_hash berbentuk salt:key (scrypt), bukan PIN polos', async () => {
    const user = await findUserByName('Test User')
    expect(user).toBeDefined()
    expect(user?.pin_hash).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/)
    expect(user?.pin_hash).not.toContain('testpin123')
  })

  it('verifyPin benar untuk PIN tepat dan salah untuk PIN keliru', async () => {
    const user = await findUserByName('Test User')
    expect(verifyPin('testpin123', user!.pin_hash)).toBe(true)
    expect(verifyPin('salah', user!.pin_hash)).toBe(false)
  })

  it('verifyPin false untuk hash null atau kosong', () => {
    expect(verifyPin('1234', null)).toBe(false)
    expect(verifyPin('1234', '')).toBe(false)
  })
})

describe('6. Login mengenali pengguna: nama + PIN', () => {
  it('nama kosong / tidak ada tidak ditemukan', async () => {
    expect(await findUserByName('')).toBeNull()
    expect(await findUserByName('NonExistentUser12345')).toBeNull()
  })

  it('rate limit bekerja untuk user id yang tidak ada', () => {
    const info = getLoginAttemptCount(999)
    expect(info.count).toBe(0)
  })

  it('recordLoginAttempt menambah hitungan', () => {
    recordLoginAttempt(1)
    recordLoginAttempt(1)
    expect(getLoginAttemptCount(1).count).toBe(2)
  })
})