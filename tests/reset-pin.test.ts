import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Fastify from 'fastify'
import Database from 'better-sqlite3'
import { runMigrations } from '../server/src/db/index'
import {
  initDb,
  createUser,
  resetAllAttempts,
  recordUsernameFailure,
  getUsernameFailures,
  findUserByName
} from '../server/src/modules/auth/model'
import { resetUserPin, ResetPinError } from '../server/src/modules/auth/reset-pin'
import { registerAuthRoutes } from '../server/src/modules/auth/routes'

let db: Database.Database
let app: ReturnType<typeof Fastify>

const NAME = 'Admin'
const OLD_PIN = '123456'
const NEW_PIN = '654321'

beforeEach(async () => {
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  runMigrations(db, 'migrations')
  initDb(db)
  resetAllAttempts()
  await createUser(NAME, 'admin', OLD_PIN)

  app = Fastify({ logger: false })
  registerAuthRoutes(app, { db })
  await app.ready()
})

afterEach(async () => {
  await app.close()
  db.close()
})

function login(pin: string) {
  return app.inject({ method: 'POST', url: '/api/login', payload: { name: NAME, pin } })
}

function sessionCookie(res: { headers: Record<string, unknown> }): string {
  const setCookie = res.headers['set-cookie'] as string
  return /kasir_session=([^;]+)/.exec(setCookie)![1]
}

describe('reset PIN pengguna', () => {
  it('PIN lama tidak berlaku, PIN baru berlaku, sesi lama tidak valid', async () => {
    const before = await login(OLD_PIN)
    expect(before.statusCode).toBe(200)
    const oldCookie = sessionCookie(before)

    recordUsernameFailure(NAME)
    expect(getUsernameFailures(NAME).count).toBe(1)

    const result = resetUserPin(db, NAME, NEW_PIN)
    expect(result.sessionsDeleted).toBe(1)
    expect(getUsernameFailures(NAME).count).toBe(0)
    expect(db.prepare('SELECT COUNT(*) AS n FROM sessions').get()).toEqual({ n: 0 })

    const me = await app.inject({
      method: 'GET',
      url: '/api/me',
      headers: { cookie: `kasir_session=${oldCookie}` }
    })
    expect(me.statusCode).toBe(401)

    const withOldPin = await login(OLD_PIN)
    expect(withOldPin.statusCode).toBe(401)

    const withNewPin = await login(NEW_PIN)
    expect(withNewPin.statusCode).toBe(200)
    expect(withNewPin.json().user.role).toBe('admin')
  })

  it('PIN pendek atau bukan angka ditolak dan hash tidak berubah', async () => {
    const hashBefore = (await findUserByName(NAME))!.pin_hash

    expect(() => resetUserPin(db, NAME, '12345')).toThrow(ResetPinError)
    expect(() => resetUserPin(db, NAME, '12ab56')).toThrow(/hanya boleh angka/)

    expect((await findUserByName(NAME))!.pin_hash).toBe(hashBefore)
    expect((await login(OLD_PIN)).statusCode).toBe(200)
  })

  it('menolak pengguna yang tidak ada', () => {
    expect(() => resetUserPin(db, 'Tidak Ada', NEW_PIN)).toThrow(/tidak ditemukan/)
  })
})
