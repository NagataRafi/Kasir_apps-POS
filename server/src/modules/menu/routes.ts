import type { FastifyInstance, FastifyReply } from 'fastify'
import type Database from 'better-sqlite3'
import { z } from 'zod'
import type { AuthMiddleware } from '../auth/middleware'

/**
 * Modul kategori dan menu (F-01).
 * Tulis: admin saja. Baca: admin dan kasir. Publik: GET /api/public/menu.
 * Tidak ada hapus permanen; status nonaktif dipakai.
 */

interface CategoryRow {
  id: number
  name: string
  sort: number
  active: number
}

interface MenuItemRow {
  id: number
  category_id: number
  name: string
  description: string | null
  price: number
  photo_path: string | null
  available: number
  sort: number
}

const nameSchema = z.string().trim().min(1, 'Nama wajib diisi').max(60, 'Nama maksimal 60 karakter')
const sortSchema = z.number().int('Urutan harus bilangan bulat').min(0, 'Urutan tidak boleh negatif')
const idSchema = z.coerce.number().int('ID harus bilangan bulat').positive('ID tidak valid')

// Harga: bilangan bulat rupiah, tidak boleh negatif, bukan string.
const priceSchema = z
  .number()
  .int('Harga harus bilangan bulat rupiah')
  .min(0, 'Harga tidak boleh negatif')
  .max(1_000_000_000, 'Harga terlalu besar')

const categoryCreateSchema = z.object({
  name: nameSchema,
  sort: sortSchema.optional()
})

const categoryUpdateSchema = z.object({
  name: nameSchema.optional(),
  sort: sortSchema.optional()
})

const activeSchema = z.object({ active: z.boolean() })
const availableSchema = z.object({ available: z.boolean() })
const reorderSchema = z.object({
  items: z.array(z.object({ id: idSchema, sort: sortSchema })).min(1, 'Daftar urutan kosong')
})

const menuItemFields = {
  category_id: idSchema,
  name: nameSchema,
  description: z.string().trim().max(500, 'Deskripsi maksimal 500 karakter').nullish(),
  price: priceSchema,
  photo_path: z.string().trim().max(255, 'Path foto maksimal 255 karakter').nullish(),
  available: z.boolean().optional(),
  sort: sortSchema.optional()
}

const menuItemCreateSchema = z.object(menuItemFields)
const menuItemUpdateSchema = z.object({
  ...menuItemFields,
  category_id: idSchema.optional(),
  name: nameSchema.optional(),
  price: priceSchema.optional()
})

function invalid(reply: FastifyReply, error: string, details?: unknown) {
  return reply.code(400).send(details ? { error, details } : { error })
}

function parseBody<T extends z.ZodType>(schema: T, body: unknown, reply: FastifyReply): z.infer<T> | null {
  const result = schema.safeParse(body ?? {})
  if (!result.success) {
    invalid(
      reply,
      'Input tidak valid',
      result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    )
    return null
  }
  return result.data
}

function categoryExists(db: Database.Database, id: number): boolean {
  return Boolean(db.prepare('SELECT 1 FROM categories WHERE id = ?').get(id))
}

function serializeCategory(row: CategoryRow) {
  return { id: row.id, name: row.name, sort: row.sort, active: Boolean(row.active) }
}

function serializeMenuItem(row: MenuItemRow) {
  return {
    id: row.id,
    category_id: row.category_id,
    name: row.name,
    description: row.description,
    price: row.price,
    photo_path: row.photo_path,
    available: Boolean(row.available),
    sort: row.sort
  }
}

function nextSort(db: Database.Database, table: 'categories' | 'menu_items', categoryId?: number): number {
  const row =
    table === 'categories'
      ? (db.prepare('SELECT MAX(sort) AS max_sort FROM categories').get() as { max_sort: number | null })
      : (db
          .prepare('SELECT MAX(sort) AS max_sort FROM menu_items WHERE category_id = ?')
          .get(categoryId) as { max_sort: number | null })
  return (row.max_sort ?? 0) + 1
}

export function registerMenuRoutes(fastify: FastifyInstance, opts: { db: Database.Database; auth: AuthMiddleware }) {
  const db = opts.db
  const { auth } = opts
  const adminOnly = auth.requireRole('admin')
  const staffRead = auth.requireRole('admin', 'kasir')

  // ---------------- Kategori ----------------

  fastify.get('/api/categories', { preHandler: staffRead }, async () => {
    const rows = db.prepare('SELECT * FROM categories ORDER BY sort, id').all() as CategoryRow[]
    return { categories: rows.map(serializeCategory) }
  })

  fastify.post('/api/categories', { preHandler: adminOnly }, async (request, reply) => {
    const data = parseBody(categoryCreateSchema, request.body, reply)
    if (!data) return

    const sort = data.sort ?? nextSort(db, 'categories')
    const result = db.prepare('INSERT INTO categories (name, sort) VALUES (?, ?)').run(data.name, sort)
    const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid) as CategoryRow
    return reply.code(201).send({ category: serializeCategory(row) })
  })

  fastify.put('/api/categories/:id', { preHandler: adminOnly }, async (request, reply) => {
    const id = parseBody(idSchema, (request.params as { id: string }).id, reply)
    if (id === null) return
    const data = parseBody(categoryUpdateSchema, request.body, reply)
    if (!data) return

    const sets: string[] = []
    const values: unknown[] = []
    if (data.name !== undefined) {
      sets.push('name = ?')
      values.push(data.name)
    }
    if (data.sort !== undefined) {
      sets.push('sort = ?')
      values.push(data.sort)
    }
    if (sets.length === 0) return invalid(reply, 'Tidak ada perubahan')

    values.push(id)
    const result = db.prepare(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`).run(...values)
    if (result.changes === 0) return reply.code(404).send({ error: 'Kategori tidak ditemukan' })
    const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as CategoryRow
    return { category: serializeCategory(row) }
  })

  fastify.put('/api/categories/:id/active', { preHandler: adminOnly }, async (request, reply) => {
    const id = parseBody(idSchema, (request.params as { id: string }).id, reply)
    if (id === null) return
    const data = parseBody(activeSchema, request.body, reply)
    if (!data) return

    const result = db
      .prepare('UPDATE categories SET active = ? WHERE id = ?')
      .run(data.active ? 1 : 0, id)
    if (result.changes === 0) return reply.code(404).send({ error: 'Kategori tidak ditemukan' })
    const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as CategoryRow
    return { category: serializeCategory(row) }
  })

  fastify.put('/api/categories/order', { preHandler: adminOnly }, async (request, reply) => {
    const data = parseBody(reorderSchema, request.body, reply)
    if (!data) return

    const update = db.prepare('UPDATE categories SET sort = ? WHERE id = ?')
    const run = db.transaction(() => {
      for (const item of data.items) {
        if (!categoryExists(db, item.id)) return item.id
        update.run(item.sort, item.id)
      }
      return null
    })
    const missing = run()
    if (missing !== null) return invalid(reply, `Kategori ${missing} tidak ditemukan`)

    const rows = db.prepare('SELECT * FROM categories ORDER BY sort, id').all() as CategoryRow[]
    return { categories: rows.map(serializeCategory) }
  })

  // ---------------- Menu ----------------

  fastify.get('/api/menu-items', { preHandler: staffRead }, async (request, reply) => {
    const query = request.query as { category_id?: string }
    if (query?.category_id !== undefined) {
      const categoryId = idSchema.safeParse(query.category_id)
      if (!categoryId.success) return invalid(reply, 'category_id tidak valid')
      const rows = db
        .prepare('SELECT * FROM menu_items WHERE category_id = ? ORDER BY sort, id')
        .all(categoryId.data) as MenuItemRow[]
      return { menu_items: rows.map(serializeMenuItem) }
    }
    const rows = db.prepare('SELECT * FROM menu_items ORDER BY category_id, sort, id').all() as MenuItemRow[]
    return { menu_items: rows.map(serializeMenuItem) }
  })

  fastify.post('/api/menu-items', { preHandler: adminOnly }, async (request, reply) => {
    const data = parseBody(menuItemCreateSchema, request.body, reply)
    if (!data) return
    if (!categoryExists(db, data.category_id)) return invalid(reply, 'Kategori tidak ditemukan')

    const sort = data.sort ?? nextSort(db, 'menu_items', data.category_id)
    const result = db
      .prepare(
        `INSERT INTO menu_items (category_id, name, description, price, photo_path, available, sort)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.category_id,
        data.name,
        data.description ?? null,
        data.price,
        data.photo_path ?? null,
        data.available === false ? 0 : 1,
        sort
      )
    const row = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(result.lastInsertRowid) as MenuItemRow
    return reply.code(201).send({ menu_item: serializeMenuItem(row) })
  })

  fastify.put('/api/menu-items/:id', { preHandler: adminOnly }, async (request, reply) => {
    const id = parseBody(idSchema, (request.params as { id: string }).id, reply)
    if (id === null) return
    const data = parseBody(menuItemUpdateSchema, request.body, reply)
    if (!data) return
    if (data.category_id !== undefined && !categoryExists(db, data.category_id)) {
      return invalid(reply, 'Kategori tidak ditemukan')
    }

    const sets: string[] = []
    const values: unknown[] = []
    const push = (column: string, value: unknown) => {
      sets.push(`${column} = ?`)
      values.push(value)
    }
    if (data.category_id !== undefined) push('category_id', data.category_id)
    if (data.name !== undefined) push('name', data.name)
    if (data.description !== undefined) push('description', data.description ?? null)
    if (data.price !== undefined) push('price', data.price)
    if (data.photo_path !== undefined) push('photo_path', data.photo_path ?? null)
    if (data.available !== undefined) push('available', data.available ? 1 : 0)
    if (data.sort !== undefined) push('sort', data.sort)
    if (sets.length === 0) return invalid(reply, 'Tidak ada perubahan')

    values.push(id)
    const result = db.prepare(`UPDATE menu_items SET ${sets.join(', ')} WHERE id = ?`).run(...values)
    if (result.changes === 0) return reply.code(404).send({ error: 'Menu tidak ditemukan' })
    const row = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id) as MenuItemRow
    return { menu_item: serializeMenuItem(row) }
  })

  fastify.put('/api/menu-items/:id/available', { preHandler: adminOnly }, async (request, reply) => {
    const id = parseBody(idSchema, (request.params as { id: string }).id, reply)
    if (id === null) return
    const data = parseBody(availableSchema, request.body, reply)
    if (!data) return

    const result = db
      .prepare('UPDATE menu_items SET available = ? WHERE id = ?')
      .run(data.available ? 1 : 0, id)
    if (result.changes === 0) return reply.code(404).send({ error: 'Menu tidak ditemukan' })
    const row = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id) as MenuItemRow
    return { menu_item: serializeMenuItem(row) }
  })

  fastify.put('/api/menu-items/order', { preHandler: adminOnly }, async (request, reply) => {
    const data = parseBody(reorderSchema, request.body, reply)
    if (!data) return

    const find = db.prepare('SELECT id FROM menu_items WHERE id = ?')
    const update = db.prepare('UPDATE menu_items SET sort = ? WHERE id = ?')
    const run = db.transaction(() => {
      for (const item of data.items) {
        if (!find.get(item.id)) return item.id
        update.run(item.sort, item.id)
      }
      return null
    })
    const missing = run()
    if (missing !== null) return invalid(reply, `Menu ${missing} tidak ditemukan`)

    const rows = db.prepare('SELECT * FROM menu_items ORDER BY category_id, sort, id').all() as MenuItemRow[]
    return { menu_items: rows.map(serializeMenuItem) }
  })

  // ---------------- Publik (tanpa login) ----------------

  fastify.get('/api/public/menu', async () => {
    const categories = db
      .prepare('SELECT id, name FROM categories WHERE active = 1 ORDER BY sort, id')
      .all() as { id: number; name: string }[]
    const items = db
      .prepare(
        `SELECT id, category_id, name, description, price, photo_path
         FROM menu_items
         WHERE available = 1
         ORDER BY sort, id`
      )
      .all() as {
      id: number
      category_id: number
      name: string
      description: string | null
      price: number
      photo_path: string | null
    }[]

    return {
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        items: items
          .filter((item) => item.category_id === category.id)
          .map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            photo_path: item.photo_path
          }))
      }))
    }
  })
}
