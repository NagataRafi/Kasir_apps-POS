import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Fastify from 'fastify'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { runMigrations } from '../server/src/db/index'
import { initDb, createUser } from '../server/src/modules/auth/model'
import { createAuthMiddleware } from '../server/src/modules/auth/middleware'
import { createSession } from '../server/src/modules/auth/session'
import { registerMenuRoutes } from '../server/src/modules/menu/routes'

let db: Database.Database
let app: ReturnType<typeof Fastify>
let adminCookie: string
let kasirCookie: string

beforeEach(async () => {
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  runMigrations(db, 'migrations')
  initDb(db)

  const admin = await createUser('Admin', 'admin', '123456')
  const kasir = await createUser('Kasir', 'kasir', '123456')
  adminCookie = `kasir_session=${createSession(db, admin.id).token}`
  kasirCookie = `kasir_session=${createSession(db, kasir.id).token}`

  app = Fastify({ logger: false })
  const auth = createAuthMiddleware(db)
  registerMenuRoutes(app, { db, auth })
  await app.ready()
})

afterEach(async () => {
  await app.close()
  db.close()
})

async function createCategory(name = 'Kopi', cookie = adminCookie) {
  return app.inject({
    method: 'POST',
    url: '/api/categories',
    headers: { cookie },
    payload: { name }
  })
}

async function createMenuItem(payload: Record<string, unknown>, cookie = adminCookie) {
  return app.inject({
    method: 'POST',
    url: '/api/menu-items',
    headers: { cookie },
    payload: { name: 'Espresso', price: 18000, ...payload }
  })
}

describe('F-01 validasi harga dan input', () => {
  it('menolak harga negatif, harga bukan bilangan bulat, dan harga bukan angka', async () => {
    const category = await createCategory()
    expect(category.statusCode).toBe(201)
    const categoryId = category.json().category.id

    for (const price of [-1, -15000, 12000.5, '15000', null]) {
      const res = await createMenuItem({ category_id: categoryId, price })
      expect(res.statusCode, `harga ${JSON.stringify(price)} harus ditolak`).toBe(400)
      expect(res.json().error).toBe('Input tidak valid')
    }

    const ok = await createMenuItem({ category_id: categoryId, price: 0 })
    expect(ok.statusCode).toBe(201)
    expect(ok.json().menu_item.price).toBe(0)
  })

  it('menolak nama kosong dan kategori yang tidak ada', async () => {
    const category = await createCategory()
    const categoryId = category.json().category.id

    const emptyName = await createMenuItem({ category_id: categoryId, name: '   ' })
    expect(emptyName.statusCode).toBe(400)

    const emptyCategoryName = await createCategory('  ')
    expect(emptyCategoryName.statusCode).toBe(400)

    const missingCategory = await createMenuItem({ category_id: 9999 })
    expect(missingCategory.statusCode).toBe(400)
    expect(missingCategory.json().error).toBe('Kategori tidak ditemukan')
  })

  it('menolak perubahan harga ke nilai tidak valid', async () => {
    const category = await createCategory()
    const categoryId = category.json().category.id
    const item = await createMenuItem({ category_id: categoryId, price: 20000 })
    const itemId = item.json().menu_item.id

    const res = await app.inject({
      method: 'PUT',
      url: `/api/menu-items/${itemId}`,
      headers: { cookie: adminCookie },
      payload: { price: 1500.75 }
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('F-01 izin per peran', () => {
  it('tanpa login ditolak 401, kasir boleh baca tetapi tidak boleh tulis', async () => {
    const anonymous = await app.inject({ method: 'GET', url: '/api/categories' })
    expect(anonymous.statusCode).toBe(401)

    const kasirRead = await app.inject({
      method: 'GET',
      url: '/api/categories',
      headers: { cookie: kasirCookie }
    })
    expect(kasirRead.statusCode).toBe(200)

    const kasirWrite = await app.inject({
      method: 'POST',
      url: '/api/categories',
      headers: { cookie: kasirCookie },
      payload: { name: 'Dapur' }
    })
    expect(kasirWrite.statusCode).toBe(403)

    const kasirMenuItemWrite = await app.inject({
      method: 'POST',
      url: '/api/menu-items',
      headers: { cookie: kasirCookie },
      payload: { category_id: 1, name: 'Latte', price: 25000 }
    })
    expect(kasirMenuItemWrite.statusCode).toBe(403)
  })

  it('admin boleh menulis, mengubah urutan, dan menonaktifkan', async () => {
    const first = await createCategory('Kopi')
    const second = await createCategory('Makanan')
    const firstId = first.json().category.id
    const secondId = second.json().category.id

    const order = await app.inject({
      method: 'PUT',
      url: '/api/categories/order',
      headers: { cookie: adminCookie },
      payload: { items: [{ id: firstId, sort: 2 }, { id: secondId, sort: 1 }] }
    })
    expect(order.statusCode).toBe(200)
    expect(order.json().categories.map((c: { id: number }) => c.id)).toEqual([secondId, firstId])

    const deactivate = await app.inject({
      method: 'PUT',
      url: `/api/categories/${firstId}/active`,
      headers: { cookie: adminCookie },
      payload: { active: false }
    })
    expect(deactivate.statusCode).toBe(200)
    expect(deactivate.json().category.active).toBe(false)

    const item = await createMenuItem({ category_id: secondId })
    const itemId = item.json().menu_item.id
    const setUnavailable = await app.inject({
      method: 'PUT',
      url: `/api/menu-items/${itemId}/available`,
      headers: { cookie: adminCookie },
      payload: { available: false }
    })
    expect(setUnavailable.statusCode).toBe(200)
    expect(setUnavailable.json().menu_item.available).toBe(false)
  })
})

describe('GET /api/public/menu tanpa login', () => {
  it('hanya menampilkan kategori aktif dan menu tersedia, tanpa data internal', async () => {
    const active = await createCategory('Kopi')
    const activeId = active.json().category.id
    const hidden = await createCategory('Musiman')
    const hiddenId = hidden.json().category.id

    const available = await createMenuItem({ category_id: activeId, name: 'Espresso', price: 18000 })
    const soldOut = await createMenuItem({ category_id: activeId, name: 'Kopi Susu', price: 22000 })
    await createMenuItem({ category_id: hiddenId, name: 'Menu Rahasia', price: 30000 })

    await app.inject({
      method: 'PUT',
      url: `/api/menu-items/${soldOut.json().menu_item.id}/available`,
      headers: { cookie: adminCookie },
      payload: { available: false }
    })
    await app.inject({
      method: 'PUT',
      url: `/api/categories/${hiddenId}/active`,
      headers: { cookie: adminCookie },
      payload: { active: false }
    })

    const res = await app.inject({ method: 'GET', url: '/api/public/menu' })
    expect(res.statusCode).toBe(200)
    const body = res.json()

    expect(body.categories.map((c: { name: string }) => c.name)).toEqual(['Kopi'])
    expect(body.categories[0].items).toHaveLength(1)
    expect(body.categories[0].items[0].id).toBe(available.json().menu_item.id)
    expect(body.categories[0].items[0].name).toBe('Espresso')

    const raw = JSON.stringify(body)
    expect(raw).not.toContain('Menu Rahasia')
    expect(raw).not.toContain('Kopi Susu')
    expect(raw).not.toContain('"available"')
    expect(raw).not.toContain('"sort"')
    expect(raw).not.toContain('"active"')
    expect(raw).not.toContain('"category_id"')
  })
})

describe('Migrasi 003 setelah 001 dan 002', () => {
  it('berjalan berurutan dan membuat tabel categories dan menu_items', () => {
    const fresh = new Database(':memory:')
    fresh.pragma('foreign_keys = ON')
    const ran = runMigrations(fresh, 'migrations')

    const expected = fs
      .readdirSync(path.join('migrations'))
      .filter((f) => f.endsWith('.sql'))
      .sort()
    expect(ran).toEqual(expected)
    expect(ran.indexOf('003_categories_menu_items.sql')).toBeGreaterThan(
      ran.indexOf('002_sessions_table.sql')
    )

    const tables = (
      fresh.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]
    ).map((t) => t.name)
    expect(tables).toContain('categories')
    expect(tables).toContain('menu_items')

    const columns = (
      fresh.prepare('PRAGMA table_info(menu_items)').all() as { name: string }[]
    ).map((c) => c.name)
    expect(columns).toEqual(
      expect.arrayContaining(['id', 'category_id', 'name', 'description', 'price', 'photo_path', 'available', 'sort'])
    )

    // Harga float ditolak oleh constraint database.
    fresh.prepare("INSERT INTO categories (name) VALUES ('Kopi')").run()
    expect(() =>
      fresh.prepare("INSERT INTO menu_items (category_id, name, price) VALUES (1, 'X', 100.5)").run()
    ).toThrow()

    fresh.close()
  })
})
