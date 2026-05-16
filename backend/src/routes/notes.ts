import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import prisma from '../db/client.js'
import { authenticate } from '../middleware/auth.js'
import { generateAiSummary } from '../services/aiService.js'

const createNoteSchema = z.object({
  title: z.string().max(200).optional().default('Untitled Note'),
  content: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  color: z.string().optional().default('#ffffff'),
})

const updateNoteSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional(),
  isArchived: z.boolean().optional(),
  isPinned: z.boolean().optional(),
})

async function upsertTags(tagNames: string[]) {
  const tags = []
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name: name.toLowerCase().trim() },
      update: {},
      create: {
        name: name.toLowerCase().trim(),
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
      },
    })
    tags.push(tag)
  }
  return tags
}

export async function notesRoutes(fastify: FastifyInstance) {
  // All notes routes require auth
  fastify.addHook('preHandler', authenticate)

  // GET /notes - list with search, filter, sort
  fastify.get('/notes', async (request, reply) => {
    const query = request.query as {
      search?: string
      tag?: string
      archived?: string
      sort?: string
      page?: string
      limit?: string
    }

    const page = parseInt(query.page ?? '1')
    const limit = parseInt(query.limit ?? '20')
    const skip = (page - 1) * limit

    const where: any = {
      userId: request.user.id,
      isArchived: query.archived === 'true',
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    if (query.tag) {
      where.tags = {
        some: { tag: { name: query.tag.toLowerCase() } },
      }
    }

    const orderBy =
      query.sort === 'created'
        ? { createdAt: 'desc' as const }
        : query.sort === 'title'
        ? { title: 'asc' as const }
        : { updatedAt: 'desc' as const }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, orderBy],
        skip,
        take: limit,
        include: {
          tags: { include: { tag: true } },
          aiSummary: { select: { summary: true, suggestedTitle: true, updatedAt: true } },
        },
      }),
      prisma.note.count({ where }),
    ])

    return reply.send({
      notes: notes.map(formatNote),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  })

  // GET /notes/:id - single note
  fastify.get('/notes/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const note = await prisma.note.findFirst({
      where: { id, userId: request.user.id },
      include: {
        tags: { include: { tag: true } },
        aiSummary: true,
      },
    })

    if (!note) return reply.status(404).send({ error: 'Note not found' })

    return reply.send({ note: formatNote(note) })
  })

  // POST /notes - create note
  fastify.post('/notes', async (request, reply) => {
    try {
      const body = createNoteSchema.parse(request.body)
      const tags = await upsertTags(body.tags)

      const note = await prisma.note.create({
        data: {
          userId: request.user.id,
          title: body.title,
          content: body.content,
          color: body.color,
          wordCount: body.content.split(/\s+/).filter(Boolean).length,
          tags: {
            create: tags.map((t) => ({ tagId: t.id })),
          },
        },
        include: {
          tags: { include: { tag: true } },
          aiSummary: true,
        },
      })

      return reply.status(201).send({ note: formatNote(note) })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors })
      }
      throw err
    }
  })

  // PATCH /notes/:id - update note
  fastify.patch('/notes/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateNoteSchema.parse(request.body)

      const existing = await prisma.note.findFirst({ where: { id, userId: request.user.id } })
      if (!existing) return reply.status(404).send({ error: 'Note not found' })

      const updateData: any = {}
      if (body.title !== undefined) updateData.title = body.title
      if (body.content !== undefined) {
        updateData.content = body.content
        updateData.wordCount = body.content.split(/\s+/).filter(Boolean).length
      }
      if (body.color !== undefined) updateData.color = body.color
      if (body.isArchived !== undefined) updateData.isArchived = body.isArchived
      if (body.isPinned !== undefined) updateData.isPinned = body.isPinned

      if (body.tags !== undefined) {
        const tags = await upsertTags(body.tags)
        await prisma.noteTag.deleteMany({ where: { noteId: id } })
        updateData.tags = { create: tags.map((t) => ({ tagId: t.id })) }
      }

      const note = await prisma.note.update({
        where: { id },
        data: updateData,
        include: {
          tags: { include: { tag: true } },
          aiSummary: true,
        },
      })

      return reply.send({ note: formatNote(note) })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors })
      }
      throw err
    }
  })

  // DELETE /notes/:id
  fastify.delete('/notes/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const existing = await prisma.note.findFirst({ where: { id, userId: request.user.id } })
    if (!existing) return reply.status(404).send({ error: 'Note not found' })

    await prisma.note.delete({ where: { id } })
    return reply.send({ message: 'Note deleted successfully' })
  })

  // POST /notes/:id/generate-summary - AI summary
  fastify.post('/notes/:id/generate-summary', async (request, reply) => {
    const { id } = request.params as { id: string }

    const note = await prisma.note.findFirst({ where: { id, userId: request.user.id } })
    if (!note) return reply.status(404).send({ error: 'Note not found' })

    if (!note.content || note.content.trim().length < 10) {
      return reply.status(400).send({
        error: 'Content too short',
        message: 'Note needs at least 10 characters to generate a summary',
      })
    }

    const result = await generateAiSummary(note.content, note.title)

    // Save/update summary
    const summary = await prisma.aiSummary.upsert({
      where: { noteId: id },
      update: {
        summary: result.summary,
        actionItems: result.actionItems,
        suggestedTitle: result.suggestedTitle,
        keyTopics: result.keyTopics,
        sentiment: result.sentiment,
        provider: result.provider,
        modelUsed: result.modelUsed,
      },
      create: {
        noteId: id,
        summary: result.summary,
        actionItems: result.actionItems,
        suggestedTitle: result.suggestedTitle,
        keyTopics: result.keyTopics,
        sentiment: result.sentiment,
        provider: result.provider,
        modelUsed: result.modelUsed,
      },
    })

    // Log AI usage
    await prisma.aiUsageLog.create({
      data: {
        userId: request.user.id,
        noteId: id,
        provider: result.provider,
        feature: 'summary',
        tokens: Math.ceil(note.content.length / 4),
      },
    })

    return reply.send({ summary })
  })

  // POST /notes/:id/share - generate share link
  fastify.post('/notes/:id/share', async (request, reply) => {
    const { id } = request.params as { id: string }

    const existing = await prisma.note.findFirst({ where: { id, userId: request.user.id } })
    if (!existing) return reply.status(404).send({ error: 'Note not found' })

    const shareId = existing.shareId ?? uuidv4()

    const note = await prisma.note.update({
      where: { id },
      data: { shareId, isPublic: true },
    })

    return reply.send({
      shareId: note.shareId,
      shareUrl: `${process.env.FRONTEND_URL}/shared/${note.shareId}`,
    })
  })

  // DELETE /notes/:id/share - revoke share link
  fastify.delete('/notes/:id/share', async (request, reply) => {
    const { id } = request.params as { id: string }

    const existing = await prisma.note.findFirst({ where: { id, userId: request.user.id } })
    if (!existing) return reply.status(404).send({ error: 'Note not found' })

    await prisma.note.update({
      where: { id },
      data: { shareId: null, isPublic: false },
    })

    return reply.send({ message: 'Share link revoked' })
  })
}

// ─── Format helper ────────────────────────────────────────────────────────────
function formatNote(note: any) {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    isArchived: note.isArchived,
    isPinned: note.isPinned,
    isPublic: note.isPublic,
    shareId: note.shareId,
    color: note.color,
    wordCount: note.wordCount,
    tags: note.tags?.map((nt: any) => ({
      id: nt.tag.id,
      name: nt.tag.name,
      color: nt.tag.color,
    })) ?? [],
    aiSummary: note.aiSummary ?? null,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  }
}
