import type { FastifyRequest, FastifyReply } from 'fastify'

export function requireAuth(request: FastifyRequest, reply: FastifyReply, next: any) {
  const session = (request as any).session

  if (!session?.userId) {
    return reply.code(401).send({ error: 'Authentication required' })
  }

  next()
}

export function requireRole(...allowedRoles: ('admin' | 'kasir' | 'dapur')[]) {
  return async (request: FastifyRequest, reply: FastifyReply, next: any) => {
    const session = (request as any).session

    if (!session?.userId) {
      return reply.code(401).send({ error: 'Authentication required' })
    }

    if (!allowedRoles.includes(session.userRole as any)) {
      return reply.code(403).send({ error: `Access denied. Required roles: ${allowedRoles.join(', ')}` })
    }

    next()
  }
}

export const roles = {
  admin: requireRole('admin'),
  kasir: requireRole('kasir'),
  dapur: requireRole('dapur'),
}