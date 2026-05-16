export interface Tag {
  id: string
  name: string
  color: string
}

export interface AiSummary {
  id: string
  noteId: string
  summary: string
  actionItems: string[]
  suggestedTitle?: string
  keyTopics: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  provider: string
  modelUsed: string
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: string
  title: string
  content: string
  isArchived: boolean
  isPinned: boolean
  isPublic: boolean
  shareId?: string
  color: string
  wordCount: number
  tags: Tag[]
  aiSummary?: AiSummary | null
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: string
}

export interface InsightData {
  totalNotes: number
  archivedNotes: number
  totalWords: number
  recentNotes: Array<{
    id: string
    title: string
    updatedAt: string
    wordCount: number
    color: string
  }>
  ai: {
    totalUsage: number
    usageThisWeek: number
    byProvider: Array<{ provider: string; count: number }>
  }
  topTags: Array<{ id: string; name: string; color: string; count: number }>
  weeklyActivity: Array<{ date: string; count: number }>
}
