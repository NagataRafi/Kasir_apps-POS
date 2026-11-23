import { FastifyRequest, FastifyReply } from 'fastify'
import { findUserByName, verifyPin, recordLoginAttempt, getLoginAttemptCount, clearLoginAttempts, createUser } from './model'
import path from 'path'

export function registerAuthRoutes(fastify: any, options: any) {
  // Login endpoint
  fastify.post('/api/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const { name, pin } = request.body as { name: string; pin: string }

    if (!name || !pin) {
      return reply.code(400).send({ error: 'Name and PIN are required' })
    }

    // Check login attempt rate limit
    const user = await findUserByName(name)
    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    const attemptInfo = getLoginAttemptCount(user.id)

    if (attemptInfo.count >= MAX_ATTEMPTS) {
      return reply.code(423).send({ error: 'Account locked. Too many failed attempts. Try again later.' })
    }

    const valid = await verifyPin(pin, user.pin_hash!)

    if (!valid) {
      recordLoginAttempt(user.id)
      const newAttemptInfo = getLoginAttemptCount(user.id)
      return reply.code(401).send({ 
        error: 'Invalid credentials', 
        attemptRemain: MAX_ATTEMPTS - newAttemptInfo.count 
      })
    }

    // Clear attempts on successful login
    clearLoginAttempts(user.id)

    // Set session cookie httpOnly with expiry (30 days)
    request.session = {
      userId: user.id,
      userRole: user.role,
      expiry: Date.now() + 30 * 24 * 60 * 60 * 1000
    }

    return reply.send({ 
      status: 'ok', 
      user: { id: user.id, name: user.name, role: user.role } 
    })
  })

  // Logout endpoint
  fastify.post('/api/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).session?.userId

    if (userId) {
      clearLoginAttempts(userId)
    }

    // Clear session cookie
    reply.clearCookie('session', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax'
    })

    request.session = null

    return { status: 'ok' }
  })

  // Me endpoint - get current user
  fastify.get('/api/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = (request as any).session

    if (!session?.userId) {
      return reply.code(401).send({ error: 'Not authenticated' })
    }

    const user = await findUserById(session.userId)

    if (!user) {
      return reply.code(404).send({ error: 'User not found' })
    }

    return send({ 
      status: 'ok', 
      user: { id: user.id, name: user.name, role: user.role } 
    })
  })
}