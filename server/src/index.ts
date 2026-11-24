import Fastify from 'fastify'
import path from 'path'
import fs from 'fs'
import { db } from './db/index'
import { initDb } from './modules/auth/model'
import { registerAuthRoutes } from './modules/auth/routes'
import { createAuthMiddleware } from './modules/auth/middleware'
import { registerMenuRoutes } from './modules/menu/routes'

// db dibuka dan semua migrasi dijalankan berurutan oleh db/index.ts.
initDb(db)

const fastify = Fastify({ logger: false })

// Health check endpoint
fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Middleware peran
const auth = createAuthMiddleware(db)
fastify.decorate('auth', auth)

// Auth: login, logout, me
registerAuthRoutes(fastify, { db })

// Kategori dan menu (F-01) + GET /api/public/menu
registerMenuRoutes(fastify, { db, auth })

// Serve static files from web/dist directory
const webDistPath = path.resolve('web/dist')
fastify.register(async (instance) => {
  instance.get('/*', async (request, reply) => {
    const filePath = path.join(webDistPath, 'index.html')
    if (fs.existsSync(filePath)) {
      return fs.promises.readFile(filePath, 'utf-8')
    }
    return { error: 'Not found' }
  })

  instance.get('/assets/*', async (request) => {
    const filePath = path.join(webDistPath, 'assets', (request.params as any)[0])
    if (fs.existsSync(filePath)) {
      return fs.promises.readFile(filePath)
    }
    return { error: 'Asset not found' }
  })
})

// Start server
fastify
  .listen({ port: 3000, host: '0.0.0.0' })
  .then((address) => {
    console.log(`Server running at ${address}`)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })