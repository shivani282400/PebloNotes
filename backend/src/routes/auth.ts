import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '../db/client.js'
import { authenticate } from '../middleware/auth.js'

const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/signup
  fastify.post('/auth/signup', async (request, reply) => {
    try {
      const body = signupSchema.parse(request.body)

      // Check if user already exists
      const existing = await prisma.user.findUnique({ where: { email: body.email } })
      if (existing) {
        return reply.status(409).send({ error: 'Conflict', message: 'Email already registered' })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(body.password, 12)

      // Create user
      const user = await prisma.user.create({
        data: {
          name: body.name,
          email: body.email,
          password: hashedPassword,
        },
        select: { id: true, name: true, email: true, createdAt: true },
      })

      // Sign JWT
      const token = fastify.jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        { expiresIn: '7d' }
      )

      return reply.status(201).send({
        message: 'Account created successfully',
        token,
        user,
      })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors })
      }
      throw err
    }
  })

  // POST /auth/login
  fastify.post('/auth/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body)

      const user = await prisma.user.findUnique({ where: { email: body.email } })
      if (!user) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid credentials' })
      }

      const valid = await bcrypt.compare(body.password, user.password)
      if (!valid) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid credentials' })
      }

      const token = fastify.jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        { expiresIn: '7d' }
      )

      return reply.send({
        message: 'Login successful',
        token,
        user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
      })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors })
      }
      throw err
    }
  })

  // GET /auth/me
  fastify.get('/auth/me', { preHandler: authenticate }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: { id: true, name: true, email: true, avatar: true, createdAt: true },
    })
    if (!user) return reply.status(404).send({ error: 'User not found' })
    return reply.send({ user })
  })
}
