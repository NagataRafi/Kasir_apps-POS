import Fastify from 'fastify'
import path from 'path'
import fs from 'fs'

const fastify = Fastify({
  logger: false
})

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

// Start server
fastify.listen({ port: 3000, host: '0.0.0.0' }).then((address) => {
  fastify.log(`Server running at ${address}`)
}).catch((err) => {
  fastify.log.error(err)
  process.exit(1)
})
