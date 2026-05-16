'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { sharedApi } from '@/lib/api'
import { Sparkles, Clock, Hash, CheckSquare, ChevronRight, AlertCircle } from 'lucide-react'
import { formatDate, timeAgo, SENTIMENT_CONFIG } from '@/lib/utils'
import dynamic from 'next/dynamic'

const MDPreview = dynamic(
  () => import('@uiw/react-md-editor').then((m) => m.default.Markdown),
  { ssr: false }
)

export default function SharedNotePage() {
  const { shareId } = useParams<{ shareId: string }>()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['shared', shareId],
    queryFn: () => sharedApi.get(shareId).then((r) => r.data.note),
    retry: false,
  })

  if (isLoading) {
    return (
      <Shell>
        <div className="max-w-3xl mx-auto space-y-6 py-16 px-6">
          <div className="h-10 w-64 rounded-xl shimmer" />
          <div className="h-4 w-40 rounded shimmer" />
          <div className="h-96 rounded-2xl shimmer" />
        </div>
      </Shell>
    )
  }

  if (isError || !data) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'var(--brand-dim)', border: '1px solid rgba(242,84,66,0.2)' }}>
            <AlertCircle size={28} style={{ color: 'var(--brand)' }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Note Not Found
          </h1>
          <p className="text-sm max-w-sm" style={{ color: 'var(--text-muted)' }}>
            This note is no longer available, or the share link has been revoked by its author.
          </p>
        </div>
      </Shell>
    )
  }

  const sentimentConf = data.aiSummary
    ? SENTIMENT_CONFIG[data.aiSummary.sentiment as keyof typeof SENTIMENT_CONFIG]
    : null

  return (
    <Shell>
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-8">
          {/* Color accent */}
          {data.color && data.color !== '#ffffff' && (
            <div className="w-12 h-1.5 rounded-full mb-6" style={{ background: data.color }} />
          )}

          <h1 className="text-4xl font-bold leading-tight mb-4"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            {data.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span>By <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{data.author}</span></span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} />
              {formatDate(data.updatedAt)}
            </span>
            {data.wordCount > 0 && (
              <>
                <span>•</span>
                <span>{data.wordCount} words</span>
              </>
            )}
          </div>

          {/* Tags */}
          {data.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {data.tags.map((tag: any) => (
                <span key={tag.id} className="tag-pill"
                  style={{ background: `${tag.color}18`, color: tag.color, border: `1px solid ${tag.color}30` }}>
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* AI Summary card */}
        {data.aiSummary && (
          <div className="mb-10 p-6 rounded-2xl"
            style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Sparkles size={12} style={{ color: 'var(--accent-blue)' }} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--accent-blue)' }}>AI Summary</span>
              {sentimentConf && (
                <span className="ml-auto text-lg">{sentimentConf.emoji}</span>
              )}
            </div>

            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-primary)' }}>
              {data.aiSummary.summary}
            </p>

            {data.aiSummary.actionItems?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Action Items
                </p>
                <ul className="space-y-1.5">
                  {data.aiSummary.actionItems.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                      <ChevronRight size={13} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--brand)' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.aiSummary.keyTopics?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.aiSummary.keyTopics.map((topic: string, i: number) => (
                  <span key={i} className="tag-pill"
                    style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Note content */}
        <div className="prose-custom" data-color-mode="dark">
          <MDPreview source={data.content} style={{ background: 'transparent', color: 'var(--text-primary)' }} />
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Last updated {timeAgo(data.updatedAt)}
          </p>
          <a href="/" className="flex items-center gap-2 text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}>
            <div className="w-5 h-5 rounded flex items-center justify-center"
              style={{ background: 'var(--brand)' }}>
              <Sparkles size={10} className="text-white" />
            </div>
            Made with Peblo Notes
          </a>
        </div>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-10 px-6 py-4 flex items-center"
        style={{ background: 'rgba(13,13,20,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--brand)' }}>
            <Sparkles size={13} className="text-white" />
          </div>
          <span className="font-bold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Peblo Notes
          </span>
        </a>
        <div className="ml-auto">
          <a href="/auth/signup"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'var(--brand)', color: 'white' }}>
            Try for free
          </a>
        </div>
      </div>
      {children}
    </div>
  )
}
