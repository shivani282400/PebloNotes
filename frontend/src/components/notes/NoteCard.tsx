'use client'
import { Note } from '@/types'
import { timeAgo, truncate } from '@/lib/utils'
import { Pin, Globe, Archive, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface NoteCardProps {
  note: Note
  onClick?: () => void
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  const hasSummary = !!note.aiSummary

  return (
    <Link href={`/notes/${note.id}`}>
      <div
        className="note-card group relative p-4 rounded-2xl cursor-pointer"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
        onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
        onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        {/* Color accent strip */}
        {note.color && note.color !== '#ffffff' && (
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-60"
            style={{ background: note.color }} />
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 flex-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            {note.title || 'Untitled Note'}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
            {note.isPinned && <Pin size={12} style={{ color: 'var(--brand)' }} />}
            {note.isPublic && <Globe size={12} style={{ color: 'var(--accent-cyan)' }} />}
          </div>
        </div>

        {/* Content preview */}
        {note.content && (
          <p className="text-xs leading-relaxed mb-3 line-clamp-3"
            style={{ color: 'var(--text-muted)' }}>
            {truncate(note.content.replace(/[#*`>\-]/g, ''), 120)}
          </p>
        )}

        {/* AI Summary badge */}
        {hasSummary && (
          <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-lg w-fit text-xs font-medium"
            style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <Sparkles size={10} />
            AI Summary ready
          </div>
        )}

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {note.tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className="tag-pill"
                style={{ background: `${tag.color}18`, color: tag.color, border: `1px solid ${tag.color}30` }}>
                #{tag.name}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="tag-pill" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {timeAgo(note.updatedAt)}
          </span>
          {note.wordCount > 0 && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {note.wordCount} words
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
