import type { FastifyRequest, FastifyReply } from 'fastify'
import type Database from 'better-sqlite3'
import { findSession, SESSION_COOKIE } from './session'
import { parseCookies } from '../../lib/cookie'

export type Role = 'admin' | 'kasir' | 'dapur'

export interface AuthMiddleware {
  requireAuth: (request: FastifyRequest, reply: FastifyReply, next: (err?: Error) => void) => void
  requireRole: (
    ...roles: Role[]
  ) => (request: FastifyRequest, reply: FastifyReply, next: (err?: Error) => void) => void
  roles: Record<Role, (request: FastifyRequest, reply: FastifyReply, next: (err?: Error) => void) => void>
}

export function createAuthMiddleware(db: Database.Database): AuthMiddleware {
  const requireAuth = (request: FastifyRequest, reply: FastifyReply, next: (err?: Error) => void) => {
    const cookies = parseCookies(request.headers.cookie)
    const session = findSession(db, cookies[SESSION_COOKIE] ?? '')
    if (!session) {
      reply.code(401).send({ error: 'Authentication required' })
      return
    }
    ;(request as any).user = session
    next()
  }

  const requireRole = (...roles: Role[]) => {
    return (request: FastifyRequest, reply: FastifyReply, next: (err?: Error) => void) => {
      const cookies = parseCookies(request.headers.cookie)
      const session = findSession(db, cookies[SESSION_COOKIE] ?? '')
      if (!session) {
        reply.code(401).send({ error: 'Authentication required' })
        return
      }
      ;(request as any).user = session
      if (!roles.includes(session.role)) {
        reply.code(403).send({ error: `Access denied. Required roles: ${roles.join(', ')}` })
        return
      }
      next()
    }
  }

  return {
    requireAuth,
    requireRole,
    roles: {
      admin: requireRole('admin'),
      kasir: requireRole('kasir'),
      dapur: requireRole('dapur')
    }
  }
}