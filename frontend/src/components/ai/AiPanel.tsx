'use client'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notesApi } from '@/lib/api'
import { AiSummary } from '@/types'
import { Sparkles, X, CheckSquare, Tag, Brain, RefreshCw, Smile, Meh, Frown, ChevronRight } from 'lucide-react'
import { timeAgo, SENTIMENT_CONFIG } from '@/lib/utils'
import toast from 'react-hot-toast'

interface AiPanelProps {
  noteId: string
  noteTitle: string
  existingSummary?: AiSummary | null
  onClose: () => void
}

export function AiPanel({ noteId, noteTitle, existingSummary, onClose }: AiPanelProps) {
  const queryClient = useQueryClient()
  const [summary, setSummary] = useState<AiSummary | null>(existingSummary ?? null)

  const generateMutation = useMutation({
    mutationFn: () => notesApi.generateSummary(noteId),
    onSuccess: (res) => {
      setSummary(res.data.summary)
      queryClient.invalidateQueries({ queryKey: ['note', noteId] })
      toast.success(`Summary generated with ${res.data.summary.provider}!`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to generate summary')
    },
  })

  const sentimentConf = summary ? SENTIMENT_CONFIG[summary.sentiment as keyof typeof SENTIMENT_CONFIG] : null

  return (
    <div
      className="w-80 flex flex-col h-full animate-slide-in-right flex-shrink-0"
      style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.15)' }}>
            <Sparkles size={14} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              AI Insights
            </h3>
            {summary && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                via {summary.provider} · {summary.modelUsed}
              </p>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
          <X size={15} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {!summary && !generateMutation.isPending && (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <Brain size={24} style={{ color: 'var(--accent-blue)' }} />
            </div>
            <h4 className="font-semibold mb-2 text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Generate AI Summary
            </h4>
            <p className="text-xs mb-5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Get a smart summary, action items, key topics, and sentiment analysis for "{noteTitle}".
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Uses Gemini → Grok fallback
            </p>
          </div>
        )}

        {generateMutation.isPending && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div className="w-5 h-5 border-2 rounded-full animate-spin flex-shrink-0"
                style={{ borderColor: 'var(--accent-blue)', borderTopColor: 'transparent' }} />
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--accent-blue)' }}>Analyzing note…</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Trying Gemini → Grok</p>
              </div>
            </div>
            <div className="h-20 rounded-xl shimmer" />
            <div className="h-16 rounded-xl shimmer" />
          </div>
        )}

        {summary && !generateMutation.isPending && (
          <div className="space-y-5 animate-fade-in">
            {/* Sentiment */}
            {sentimentConf && (
              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: `${sentimentConf.color}12`, border: `1px solid ${sentimentConf.color}25` }}>
                <span className="text-xl">{sentimentConf.emoji}</span>
                <div>
                  <p className="text-xs font-medium" style={{ color: sentimentConf.color }}>
                    {sentimentConf.label} Tone
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Overall sentiment</p>
                </div>
              </div>
            )}

            {/* Summary */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-2"
                style={{ color: 'var(--text-muted)' }}>
                <Brain size={11} /> Summary
              </h4>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {summary.summary}
              </p>
            </div>

            {/* Action Items */}
            {summary.actionItems.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-2"
                  style={{ color: 'var(--text-muted)' }}>
                  <CheckSquare size={11} /> Action Items
                </h4>
                <ul className="space-y-2">
                  {summary.actionItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm"
                      style={{ color: 'var(--text-primary)' }}>
                      <ChevronRight size={13} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--brand)' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Topics */}
            {summary.keyTopics.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-2"
                  style={{ color: 'var(--text-muted)' }}>
                  <Tag size={11} /> Key Topics
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {summary.keyTopics.map((topic, i) => (
                    <span key={i} className="tag-pill"
                      style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Title */}
            {summary.suggestedTitle && summary.suggestedTitle !== 'Untitled Note' && (
              <div className="p-3 rounded-xl"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Suggested title</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  {summary.suggestedTitle}
                </p>
              </div>
            )}

            {/* Last generated */}
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Generated {timeAgo(summary.updatedAt)}
            </p>
          </div>
        )}
      </div>

      {/* Generate button */}
      <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
          style={{
            background: generateMutation.isPending ? 'var(--bg-elevated)' : 'rgba(99,102,241,0.15)',
            color: generateMutation.isPending ? 'var(--text-muted)' : 'var(--accent-blue)',
            border: '1px solid rgba(99,102,241,0.25)',
            cursor: generateMutation.isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {generateMutation.isPending ? (
            <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Analyzing…</>
          ) : (
            <><RefreshCw size={14} /> {summary ? 'Regenerate' : 'Generate Summary'}</>
          )}
        </button>
      </div>
    </div>
  )
}
