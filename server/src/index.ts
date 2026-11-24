import Fastify from 'fastify'
import path from 'path'
import fs from 'fs'
import os from 'os'
import fastifyStatic from '@fastify/static'
import { db } from './db/index'
import { initDb } from './modules/auth/model'
import { registerAuthRoutes } from './modules/auth/routes'
import { createAuthMiddleware } from './modules/auth/middleware'
import { registerMenuRoutes } from './modules/menu/routes'
import { PORT, HOST } from './config'

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

// Sajikan hasil build web (web/dist). Aset memakai jalur nyata, rute halaman
// (/login, /kasir, /dapur, /admin, ...) jatuh ke index.html agar React Router bekerja.
const webDistPath = path.resolve('web/dist')
if (fs.existsSync(webDistPath)) {
  fastify.register(fastifyStatic, { root: webDistPath, prefix: '/' })
}

fastify.setNotFoundHandler((request, reply) => {
  if (request.url.startsWith('/api/')) {
    return reply.code(404).send({ error: 'Not found' })
  }
  if (!fs.existsSync(path.join(webDistPath, 'index.html'))) {
    return reply.code(503).send({ error: 'Web belum dibangun. Jalankan npm run build.' })
  }
  return reply.type('text/html').sendFile('index.html')
})

// Alamat IPv4 non-loopback untuk akses perangkat lain (hanya untuk pesan log).
function localNetworkUrls(port: number): string[] {
  return Object.values(os.networkInterfaces())
    .flatMap((items) => items ?? [])
    .filter((item) => item.family === 'IPv4' && !item.internal)
    .map((item) => `http://${item.address}:${port}`)
}

// Start server
fastify
  .listen({ port: PORT, host: HOST })
  .then(() => {
    console.log(`Server berjalan di http://localhost:${PORT}`)
    const lan = localNetworkUrls(PORT)
    console.log(
      `Akses perangkat lain: ${lan.length > 0 ? lan.join(', ') : 'tidak ada alamat IPv4 non-loopback terdeteksi'}`
    )
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })