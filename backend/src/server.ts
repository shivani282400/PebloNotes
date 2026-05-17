import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { authRoutes } from './routes/auth.js'
import { notesRoutes } from './routes/notes.js'
import { sharedRoutes, dashboardRoutes } from './routes/shared.js'

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
})

// ─── Plugins ──────────────────────────────────────────────────────────────────
await fastify.register(cors, {
  origin: [
    process.env.FRONTEND_URL ?? 'http://localhost:3000',
    'http://localhost:3000',
    /\.vercel\.app$/,
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
})

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'fallback-secret-change-in-production',
})

// ─── Routes ───────────────────────────────────────────────────────────────────
await fastify.register(authRoutes)
await fastify.register(notesRoutes)
await fastify.register(sharedRoutes)
await fastify.register(dashboardRoutes)

// ─── Health Check ─────────────────────────────────────────────────────────────
fastify.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '1.0.0',
}))

// ─── Error Handler ────────────────────────────────────────────────────────────
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error)
  const statusCode = error.statusCode ?? 500
  reply.status(statusCode).send({
    error: error.name ?? 'Internal Server Error',
    message: error.message ?? 'An unexpected error occurred',
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  })
})

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3001')

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' })
  console.log(`\n🚀 Peblo Notes API running at http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health\n`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
