'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { notesApi } from '@/lib/api'
import { AppShell } from '@/components/layout/AppShell'
import { AiPanel } from '@/components/ai/AiPanel'
import { TagInput } from '@/components/notes/TagInput'
import {
  ArrowLeft, Pin, Archive, Globe, Link2, Trash2,
  Sparkles, Eye, Edit3, MoreVertical, Save, ArchiveRestore
} from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { Note } from '@/types'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

const AUTOSAVE_DELAY = 1500 // 1.5 seconds

export default function NoteEditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autoSaveRef = useRef<NodeJS.Timeout>()
  const isDirty = useRef(false)

  const { data, isLoading } = useQuery({
    queryKey: ['note', id],
    queryFn: () => notesApi.get(id).then((r) => r.data.note as Note),
    enabled: !!id,
  })

  useEffect(() => {
    if (data) {
      setTitle(data.title)
      setContent(data.content)
      setTags(data.tags.map((t) => t.name))
    }
  }, [data])

  const updateMutation = useMutation({
    mutationFn: (payload: any) => notesApi.update(id, payload),
    onSuccess: () => {
      setLastSaved(new Date())
      setIsSaving(false)
      queryClient.invalidateQueries({ queryKey: ['note', id] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
    onError: () => {
      setIsSaving(false)
      toast.error('Failed to save')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => notesApi.delete(id),
    onSuccess: () => {
      toast.success('Note deleted')
      router.push('/notes')
    },
  })

  const shareMutation = useMutation({
    mutationFn: () => notesApi.share(id),
    onSuccess: (res) => {
      const url = res.data.shareUrl
      navigator.clipboard.writeText(url)
      toast.success('Share link copied to clipboard!')
      queryClient.invalidateQueries({ queryKey: ['note', id] })
    },
    onError: () => toast.error('Failed to generate share link'),
  })

  const revokeShareMutation = useMutation({
    mutationFn: () => notesApi.revokeShare(id),
    onSuccess: () => {
      toast.success('Share link revoked')
      queryClient.invalidateQueries({ queryKey: ['note', id] })
    },
  })

  // Auto-save with debounce
  const triggerSave = useCallback(
    (patch: { title?: string; content?: string; tags?: string[] }) => {
      clearTimeout(autoSaveRef.current)
      isDirty.current = true
      setIsSaving(true)
      autoSaveRef.current = setTimeout(() => {
        updateMutation.mutate(patch)
      }, AUTOSAVE_DELAY)
    },
    [updateMutation]
  )

  const handleTitleChange = (val: string) => {
    setTitle(val)
    triggerSave({ title: val, content, tags })
  }

  const handleContentChange = (val?: string) => {
    const v = val ?? ''
    setContent(v)
    triggerSave({ title, content: v, tags })
  }

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags)
    triggerSave({ title, content, tags: newTags })
  }

  const handlePin = () => {
    updateMutation.mutate({ isPinned: !data?.isPinned })
    toast.success(data?.isPinned ? 'Note unpinned' : 'Note pinned')
  }

  const handleArchive = () => {
    updateMutation.mutate({ isArchived: !data?.isArchived })
    toast.success(data?.isArchived ? 'Note restored' : 'Note archived')
    if (!data?.isArchived) router.push('/notes')
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="p-8 max-w-4xl mx-auto space-y-4">
          <div className="h-8 w-48 rounded-xl shimmer" />
          <div className="h-12 w-full rounded-xl shimmer" />
          <div className="h-96 w-full rounded-2xl shimmer" />
        </div>
      </AppShell>
    )
  }

  if (!data) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <p style={{ color: 'var(--text-muted)' }}>Note not found</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex h-full">
        {/* Editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/notes')}
                className="flex items-center gap-2 text-sm transition-all"
                style={{ color: 'var(--text-muted)' }}
                onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}>
                <ArrowLeft size={16} />
                Notes
              </button>

              <div className="text-xs px-2 py-1 rounded-lg"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                {isSaving ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : lastSaved ? (
                  `Saved ${timeAgo(lastSaved)}`
                ) : (
                  'All changes saved'
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPreview(!isPreview)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: isPreview ? 'var(--brand-dim)' : 'var(--bg-elevated)', color: isPreview ? 'var(--brand)' : 'var(--text-secondary)' }}>
                {isPreview ? <Edit3 size={13} /> : <Eye size={13} />}
                {isPreview ? 'Edit' : 'Preview'}
              </button>

              <button
                onClick={() => setShowAiPanel(!showAiPanel)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: showAiPanel ? 'rgba(99,102,241,0.15)' : 'var(--bg-elevated)', color: showAiPanel ? 'var(--accent-blue)' : 'var(--text-secondary)' }}>
                <Sparkles size={13} />
                AI
              </button>

              <button onClick={handlePin} title={data.isPinned ? 'Unpin' : 'Pin'}
                className="p-1.5 rounded-lg transition-all"
                style={{ background: data.isPinned ? 'var(--brand-dim)' : 'var(--bg-elevated)', color: data.isPinned ? 'var(--brand)' : 'var(--text-secondary)' }}>
                <Pin size={14} />
              </button>

              {data.isPublic ? (
                <button onClick={() => revokeShareMutation.mutate()}
                  title="Revoke share"
                  className="p-1.5 rounded-lg transition-all"
                  style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--accent-cyan)' }}>
                  <Globe size={14} />
                </button>
              ) : (
                <button onClick={() => shareMutation.mutate()}
                  title="Share"
                  className="p-1.5 rounded-lg transition-all"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  <Link2 size={14} />
                </button>
              )}

              <button onClick={handleArchive}
                className="p-1.5 rounded-lg transition-all"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                {data.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
              </button>

              <button
                onClick={() => {
                  if (confirm('Delete this note permanently?')) deleteMutation.mutate()
                }}
                className="p-1.5 rounded-lg transition-all"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                onMouseOver={(e) => { e.currentTarget.style.color = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-dim)' }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Editor content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-3xl mx-auto">
              {/* Title */}
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Note title…"
                className="w-full text-3xl font-bold bg-transparent border-none outline-none mb-4"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
              />

              {/* Tags */}
              <TagInput tags={tags} onChange={handleTagsChange} />

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs mb-6 pt-2"
                style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <span>Created {timeAgo(data.createdAt)}</span>
                <span>•</span>
                <span>Updated {timeAgo(data.updatedAt)}</span>
                {data.wordCount > 0 && <><span>•</span><span>{data.wordCount} words</span></>}
                {data.isPublic && <><span>•</span><span style={{ color: 'var(--accent-cyan)' }}>🌐 Public</span></>}
              </div>

              {/* Markdown Editor */}
              <div data-color-mode="dark">
                <MDEditor
                  value={content}
                  onChange={handleContentChange}
                  preview={isPreview ? 'preview' : 'edit'}
                  height={500}
                  hideToolbar={false}
                  visibleDragbar={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Panel */}
        {showAiPanel && (
          <AiPanel
            noteId={id}
            noteTitle={title}
            existingSummary={data.aiSummary}
            onClose={() => setShowAiPanel(false)}
          />
        )}
      </div>
    </AppShell>
  )
}
