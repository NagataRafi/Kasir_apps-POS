import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import {
  findUserByName,
  verifyPin,
  getUsernameFailures,
  recordUsernameFailure,
  clearUsernameFailures,
  getIpFailures,
  recordIpFailure,
  USERNAME_MAX_ATTEMPTS,
  IP_MAX_ATTEMPTS
} from './model'
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  createSession,
  findSession,
  deleteSessionByToken
} from './session'
import { parseCookies, serializeCookie, clearCookie } from '../../lib/cookie'

const INVALID_CREDENTIALS = { error: 'Invalid credentials' }

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

function sessionCookie(token: string, maxAgeSec: number): string {
  return serializeCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSec,
    secure: isProduction()
  })
}

export function registerAuthRoutes(fastify: FastifyInstance, opts: { db: any }) {
  const db = opts.db

  fastify.post('/api/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const { name, pin } = (request.body ?? {}) as { name?: string; pin?: string }
    const ip = request.ip ?? 'unknown'

    if (!name || !pin) {
      return reply.code(400).send({ error: 'Name and PIN are required' })
    }

    // Lapis 2: pembatasan per IP (20 gagal / 10 menit)
    if (getIpFailures(ip).count >= IP_MAX_ATTEMPTS) {
      return reply.code(429).send({ error: 'Too many login attempts from this IP. Try again later.' })
    }

    // Lapis 1: pembatasan per nama (5 gagal / 5 menit), termasuk nama tidak ada
    if (getUsernameFailures(name).count >= USERNAME_MAX_ATTEMPTS) {
      return reply.code(423).send({ error: 'Account temporarily locked. Try again later.' })
    }

    const user = await findUserByName(name)

    // Nama salah dan PIN salah memberi respons identik.
    if (!user) {
      recordUsernameFailure(name)
      recordIpFailure(ip)
      return reply.code(401).send(INVALID_CREDENTIALS)
    }

    if (!verifyPin(pin, user.pin_hash)) {
      recordUsernameFailure(name)
      recordIpFailure(ip)
      return reply.code(401).send(INVALID_CREDENTIALS)
    }

    // Sukses: bersihkan hitungan untuk nama ini
    clearUsernameFailures(name)

    const userAgent = request.headers['user-agent'] ?? null
    const { token } = createSession(db, user.id, ip, userAgent)

    reply.header('Set-Cookie', sessionCookie(token, Math.floor(SESSION_TTL_MS / 1000)))
    return reply.send({ status: 'ok', user: { id: user.id, name: user.name, role: user.role } })
  })

  fastify.post('/api/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    const cookies = parseCookies(request.headers.cookie)
    const token = cookies[SESSION_COOKIE]
    if (token) deleteSessionByToken(db, token)

    reply.header(
      'Set-Cookie',
      clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', path: '/', secure: isProduction() })
    )
    return reply.send({ status: 'ok' })
  })

  fastify.get('/api/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const cookies = parseCookies(request.headers.cookie)
    const session = findSession(db, cookies[SESSION_COOKIE] ?? '')
    if (!session) return reply.code(401).send({ error: 'Not authenticated' })
    return reply.send({ status: 'ok', user: { id: session.id, name: session.name, role: session.role } })
  })
}