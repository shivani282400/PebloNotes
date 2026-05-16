import { FastifyInstance } from 'fastify'
import prisma from '../db/client.js'
import { authenticate } from '../middleware/auth.js'

export async function sharedRoutes(fastify: FastifyInstance) {
  // GET /shared/:shareId - public, no auth required
  fastify.get('/shared/:shareId', async (request, reply) => {
    const { shareId } = request.params as { shareId: string }

    const note = await prisma.note.findFirst({
      where: { shareId, isPublic: true },
      include: {
        tags: { include: { tag: true } },
        aiSummary: true,
        user: { select: { name: true, avatar: true } },
      },
    })

    if (!note) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'This note is not available or the share link has been revoked',
      })
    }

    return reply.send({
      note: {
        id: note.id,
        title: note.title,
        content: note.content,
        color: note.color,
        wordCount: note.wordCount,
        tags: note.tags.map((nt: any) => ({ id: nt.tag.id, name: nt.tag.name, color: nt.tag.color })),
        aiSummary: note.aiSummary,
        author: note.user.name,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
    })
  })
}

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate)

  // GET /dashboard/insights
  fastify.get('/dashboard/insights', async (request, reply) => {
    const userId = request.user.id

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalNotes,
      archivedNotes,
      recentNotes,
      aiUsageTotal,
      aiUsageThisWeek,
      weeklyActivity,
      tagStats,
      totalWords,
    ] = await Promise.all([
      // Total active notes
      prisma.note.count({ where: { userId, isArchived: false } }),

      // Archived notes
      prisma.note.count({ where: { userId, isArchived: true } }),

      // Recently edited (last 5)
      prisma.note.findMany({
        where: { userId, isArchived: false },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, updatedAt: true, wordCount: true, color: true },
      }),

      // Total AI usage count
      prisma.aiUsageLog.count({ where: { userId } }),

      // AI usage this week
      prisma.aiUsageLog.count({
        where: { userId, createdAt: { gte: sevenDaysAgo } },
      }),

      // Weekly activity (notes created/updated per day for last 7 days)
      prisma.note.groupBy({
        by: ['updatedAt'],
        where: { userId, updatedAt: { gte: sevenDaysAgo } },
        _count: { id: true },
      }),

      // Most used tags
      prisma.noteTag.groupBy({
        by: ['tagId'],
        where: { note: { userId, isArchived: false } },
        _count: { tagId: true },
        orderBy: { _count: { tagId: 'desc' } },
        take: 10,
      }),

      // Total word count
      prisma.note.aggregate({
        where: { userId, isArchived: false },
        _sum: { wordCount: true },
      }),
    ])

    // Resolve tag names
    const tagIds = tagStats.map((t) => t.tagId)
    const tags = await prisma.tag.findMany({ where: { id: { in: tagIds } } })
    const tagMap = Object.fromEntries(tags.map((t) => [t.id, t]))

    const topTags = tagStats.map((t) => ({
      id: t.tagId,
      name: tagMap[t.tagId]?.name ?? 'unknown',
      color: tagMap[t.tagId]?.color ?? '#6366f1',
      count: t._count.tagId,
    }))

    // Build daily activity map for the last 7 days
    const activityByDay: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().split('T')[0]
      activityByDay[key] = 0
    }
    weeklyActivity.forEach((item) => {
      const key = new Date(item.updatedAt).toISOString().split('T')[0]
      if (key in activityByDay) activityByDay[key] += item._count.id
    })

    // AI providers breakdown
    const aiByProvider = await prisma.aiUsageLog.groupBy({
      by: ['provider'],
      where: { userId },
      _count: { provider: true },
    })

    return reply.send({
      insights: {
        totalNotes,
        archivedNotes,
        totalWords: totalWords._sum.wordCount ?? 0,
        recentNotes,
        ai: {
          totalUsage: aiUsageTotal,
          usageThisWeek: aiUsageThisWeek,
          byProvider: aiByProvider.map((p) => ({
            provider: p.provider,
            count: p._count.provider,
          })),
        },
        topTags,
        weeklyActivity: Object.entries(activityByDay).map(([date, count]) => ({ date, count })),
      },
    })
  })

  // GET /dashboard/tags - all tags for the user
  fastify.get('/dashboard/tags', async (request, reply) => {
    const tags = await prisma.tag.findMany({
      where: {
        notes: {
          some: { note: { userId: request.user.id } },
        },
      },
      include: {
        _count: { select: { notes: true } },
      },
      orderBy: { name: 'asc' },
    })

    return reply.send({
      tags: tags.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        noteCount: t._count.notes,
      })),
    })
  })
}
