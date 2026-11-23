import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import path from 'path'

describe('API Health Endpoint', () => {
  it('should return status ok', async () => {
    const fastify = Fastify({ logger: false })
    
    fastify.get('/api/health', async (request, reply) => {
      return { status: 'ok', timestamp: new Date().toISOString() }
    })

    const response = await fastify.ready()
    const result = await fastify.inject({
      method: 'GET',
      url: '/api/health'
    })

    expect(result.statusCode).toBe(200)
    expect(result.json()).toEqual({ status: 'ok', timestamp: expect.any(String) })
    fastify.close()
  })
})