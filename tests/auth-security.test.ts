import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Fastify from 'fastify'
import crypto from 'crypto'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { runMigrations } from '../server/src/db/index'
import { initDb, createUser, resetAllAttempts, getUsernameFailures } from '../server/src/modules/auth/model'
import { registerAuthRoutes } from '../server/src/modules/auth/routes'

let db: Database.Database
let app: ReturnType<typeof Fastify>

const PIN = '123456'

beforeEach(async () => {
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  runMigrations(db, 'migrations')
  initDb(db)
  resetAllAttempts()
  await createUser('Kasir Satu', 'kasir', PIN)

  app = Fastify({ logger: false })
  registerAuthRoutes(app, { db })
  await app.ready()
})

afterEach(async () => {
  await app.close()
  db.close()
})

function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex')
}

describe('1 & 5. Token sesi: cookie mentah, database hanya SHA-256', () => {
  it('token di database = SHA-256 token cookie, dan tidak sama dengan token itu', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/login',
      payload: { name: 'Kasir Satu', pin: PIN }
    })
    expect(res.statusCode).toBe(200)

    const setCookie = res.headers['set-cookie'] as string
    expect(setCookie).toBeTruthy()
    const match = /kasir_session=([^;]+)/.exec(setCookie)
    expect(match).toBeTruthy()
    const rawToken = decodeURIComponent(match![1])
    expect(rawToken.length).toBe(64) // 32 byte hex

    const row = db.prepare('SELECT token_hash FROM sessions').get() as { token_hash: string }
    expect(row.token_hash).toBe(sha256(rawToken))
    expect(row.token_hash).not.toBe(rawToken)

    // Cookie tidak berisi token yang terlihat polos di DB
    expect(row.token_hash).not.toContain(rawToken)
  })

  it('cookie punya httpOnly, sameSite lax, path /, maxAge 12 jam', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/login',
      payload: { name: 'Kasir Satu', pin: PIN }
    })
    const setCookie = (res.headers['set-cookie'] as string).toLowerCase()
    expect(setCookie).toContain('httponly')
    expect(setCookie).toContain('samesite=lax')
    expect(setCookie).toContain('path=/')
    expect(setCookie).toContain('max-age=43200') // 12 jam
    expect(setCookie).not.toContain('secure') // bukan production
  })
})

describe('6. Respons nama salah identik dengan PIN salah', () => {
  it('nama tidak ada dan PIN salah memberi status dan body identik', async () => {
    const wrongName = await app.inject({
      method: 'POST',
      url: '/api/login',
      payload: { name: 'Tidak Ada', pin: PIN }
    })
    const wrongPin = await app.inject({
      method: 'POST',
      url: '/api/login',
      payload: { name: 'Kasir Satu', pin: '999999' }
    })
    expect(wrongName.statusCode).toBe(wrongPin.statusCode)
    expect(wrongName.json()).toEqual(wrongPin.json())
    expect(wrongName.statusCode).toBe(401)
  })
})

describe('4. Pembatasan login dua lapis', () => {
  it('nama yang tidak ada ikut terhitung dan terkunci setelah 5 gagal', async () => {
    const name = 'Hantu Tidak Ada'
    for (let i = 0; i < 5; i++) {
      const r = await app.inject({ method: 'POST', url: '/api/login', payload: { name, pin: '000000' } })
      expect(r.statusCode).toBe(401)
    }
    expect(getUsernameFailures(name).count).toBe(5)

    const locked = await app.inject({ method: 'POST', url: '/api/login', payload: { name, pin: '000000' } })
    expect(locked.statusCode).toBe(423)
  })

  it('pembatasan per IP bekerja: 20 gagal / 10 menit lalu 429', async () => {
    // Gunakan nama berbeda tiap percobaan agar lockout per-nama tidak mendahului
    for (let i = 0; i < 20; i++) {
      const r = await app.inject({
        method: 'POST',
        url: '/api/login',
        payload: { name: `Nama-${i}`, pin: '000000' }
      })
      expect(r.statusCode).toBe(401)
    }
    const blocked = await app.inject({
      method: 'POST',
      url: '/api/login',
      payload: { name: 'Nama-final', pin: '000000' }
    })
    expect(blocked.statusCode).toBe(429)
  })
})

describe('2. Semua migrasi berjalan berurutan di database kosong', () => {
  it('runMigrations menerapkan semua berkas .sql berurutan', () => {
    const fresh = new Database(':memory:')
    fresh.pragma('foreign_keys = ON')
    const ran = runMigrations(fresh, 'migrations')

    const expected = fs
      .readdirSync(path.join('migrations'))
      .filter((f) => f.endsWith('.sql'))
      .sort()
    expect(ran).toEqual(expected)
    expect(ran[0]).toBe('001_users_tables_settings.sql')
    expect(ran).toContain('002_sessions_table.sql')

    // Tabel sessions valid dengan FK ke users
    const tables = (fresh.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]).map(
      (t) => t.name
    )
    expect(tables).toContain('sessions')
    const fk = fresh.prepare('PRAGMA foreign_key_list(sessions)').all() as { table: string; on_delete: string }[]
    expect(fk.some((f) => f.table === 'users' && f.on_delete === 'CASCADE')).toBe(true)

    // Kolom sesuai spesifikasi, tanpa user_role
    const cols = (fresh.prepare('PRAGMA table_info(sessions)').all() as { name: string }[]).map((c) => c.name)
    expect(cols).toEqual(
      expect.arrayContaining(['id', 'token_hash', 'user_id', 'ip_address', 'user_agent', 'expires_at', 'created_at', 'last_activity'])
    )
    expect(cols).not.toContain('user_role')

    fresh.close()
  })
})