import Fastify from 'fastify'
import path from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'

const fastify = Fastify({
  logger: false
})

// Initialize database
export const db = new Database('data.db', {
  verbose: false
})

db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')

// Apply migrations
db.exec('CREATE TABLE IF NOT EXISTS migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT NOT NULL UNIQUE, applied_at TEXT DEFAULT (datetime("now")))')
db.prepare('BEGIN TRANSACTION').run()
db.exec(require('fs').readFileSync('migrations/001_users_tables_settings.sql', 'utf-8'))
db.prepare('INSERT INTO migrations (filename) VALUES (?)').run('001_users_tables_settings.sql')
db.prepare('COMMIT').run()

db.prepare('BEGIN TRANSACTION').run()
db.exec(require('fs').readFileSync('migrations/002_sessions_table.sql', 'utf-8'))
db.prepare('INSERT INTO migrations (filename) VALUES (?)').run('002_sessions_table.sql')
db.prepare('COMMIT').run()

// Health check endpoint
fastify.get('/api/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

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

  instance.get('/assets/*', async (request, reply) => {
    const filePath = path.join(webDistPath, 'assets', request.params[0])
    if (fs.existsSync(filePath)) {
      return fs.promises.readFile(filePath)
    }
    return { error: 'Asset not found' }
  })
})

// Register auth module
fastify.register(async (instance) => {
  const authModel = require('../modules/auth/model').initDb(db)
  const authRoutes = require('../modules/auth/routes')
  const authMiddleware = require('../modules/auth/middleware')

  // Login, logout, me routes
  authRoutes(instance, { db })

  // Role middleware available for other modules
  instance.decorate('auth', {
    requireAuth: authMiddleware.requireAuth,
    requireRole: authMiddleware.requireRole,
    roles: authMiddleware.roles,
  })
})

// Start server
fastify.listen({ port: 3000, host: '0.0.0.0' }).then((address) => {
  fastify.log(`Server running at ${address}`)
}).catch((err) => {
  fastify.log.error(err)
  process.exit(1)
})