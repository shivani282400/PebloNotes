'use client'
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { notesApi, dashboardApi } from '@/lib/api'
import { AppShell } from '@/components/layout/AppShell'
import { NoteCard } from '@/components/notes/NoteCard'
import { Search, SlidersHorizontal, Plus, Archive, FileText, X, Tag } from 'lucide-react'
import { Note } from '@/types'

export default function NotesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [sort, setSort] = useState('updated')
  const isArchived = searchParams.get('archived') === 'true'

  const { data: notesData, isLoading } = useQuery({
    queryKey: ['notes', { search, selectedTag, sort, isArchived }],
    queryFn: () =>
      notesApi.list({
        search: search || undefined,
        tag: selectedTag || undefined,
        sort,
        archived: isArchived,
        limit: 50,
      }).then((r) => r.data),
    staleTime: 30000,
  })

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => dashboardApi.tags().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () => notesApi.create({ title: 'Untitled Note', content: '' }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      router.push(`/notes/${res.data.note.id}`)
    },
    onError: () => toast.error('Failed to create note'),
  })

  const notes: Note[] = notesData?.notes ?? []

  return (
    <AppShell onNewNote={() => createMutation.mutate()}>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {isArchived ? 'Archived Notes' : 'All Notes'}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {notesData?.pagination?.total ?? 0} notes
            </p>
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            <Plus size={15} />
            New Note
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--brand)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-2.5 rounded-xl text-sm"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', outline: 'none' }}
          >
            <option value="updated">Last updated</option>
            <option value="created">Created</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>

        {/* Tag filters */}
        {tagsData?.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedTag('')}
              className="tag-pill transition-all"
              style={{
                background: !selectedTag ? 'var(--brand-dim)' : 'var(--bg-elevated)',
                color: !selectedTag ? 'var(--brand)' : 'var(--text-muted)',
                border: `1px solid ${!selectedTag ? 'rgba(242,84,66,0.3)' : 'var(--border)'}`,
              }}
            >
              All
            </button>
            {tagsData.tags.slice(0, 12).map((tag: any) => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(selectedTag === tag.name ? '' : tag.name)}
                className="tag-pill transition-all"
                style={{
                  background: selectedTag === tag.name ? `${tag.color}20` : 'var(--bg-elevated)',
                  color: selectedTag === tag.name ? tag.color : 'var(--text-muted)',
                  border: `1px solid ${selectedTag === tag.name ? `${tag.color}40` : 'var(--border)'}`,
                }}
              >
                #{tag.name}
                <span className="text-xs opacity-60">({tag.noteCount})</span>
              </button>
            ))}
          </div>
        )}

        {/* Notes grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl shimmer" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <EmptyState isArchived={isArchived} hasSearch={!!search} onNewNote={() => createMutation.mutate()} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}

function EmptyState({ isArchived, hasSearch, onNewNote }: { isArchived: boolean; hasSearch: boolean; onNewNote: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        {isArchived ? <Archive size={24} style={{ color: 'var(--text-muted)' }} /> : <FileText size={24} style={{ color: 'var(--text-muted)' }} />}
      </div>
      <h3 className="font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
        {hasSearch ? 'No notes found' : isArchived ? 'No archived notes' : 'No notes yet'}
      </h3>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        {hasSearch ? 'Try a different search term' : isArchived ? 'Archived notes will appear here' : 'Create your first note to get started'}
      </p>
      {!isArchived && !hasSearch && (
        <button onClick={onNewNote} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--brand)', color: 'white' }}>
          <Plus size={15} /> New Note
        </button>
      )}
    </div>
  )
}
