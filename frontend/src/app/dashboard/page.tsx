'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { dashboardApi, notesApi } from '@/lib/api'
import { AppShell } from '@/components/layout/AppShell'
import { InsightData, Note } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import {
  FileText, Archive, Sparkles, Hash, Zap, TrendingUp,
  Clock, Plus, ArrowRight
} from 'lucide-react'
import { timeAgo, formatDate } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: () => dashboardApi.insights().then((r) => r.data.insights as InsightData),
    staleTime: 60000,
  })

  const createMutation = useMutation({
    mutationFn: () => notesApi.create({ title: 'Untitled Note', content: '' }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      router.push(`/notes/${res.data.note.id}`)
    },
    onError: () => toast.error('Failed to create note'),
  })

  if (isLoading) return (
    <AppShell onNewNote={() => createMutation.mutate()}>
      <div className="p-8 space-y-6">
        <div className="h-8 w-48 rounded-xl shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 rounded-2xl shimmer" />
          <div className="h-64 rounded-2xl shimmer" />
        </div>
      </div>
    </AppShell>
  )

  const stats = [
    {
      label: 'Total Notes',
      value: data?.totalNotes ?? 0,
      icon: FileText,
      color: 'var(--brand)',
      bg: 'var(--brand-dim)',
      sub: `${data?.archivedNotes ?? 0} archived`,
    },
    {
      label: 'Words Written',
      value: data?.totalWords?.toLocaleString() ?? 0,
      icon: TrendingUp,
      color: 'var(--accent-blue)',
      bg: 'rgba(99,102,241,0.1)',
      sub: 'Total across notes',
    },
    {
      label: 'AI Analyses',
      value: data?.ai.totalUsage ?? 0,
      icon: Sparkles,
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.1)',
      sub: `${data?.ai.usageThisWeek ?? 0} this week`,
    },
    {
      label: 'Tags Used',
      value: data?.topTags?.length ?? 0,
      icon: Hash,
      color: 'var(--accent-cyan)',
      bg: 'rgba(34,211,238,0.1)',
      sub: 'Across all notes',
    },
  ]

  const chartData = data?.weeklyActivity?.map((d) => ({
    day: formatDate(d.date, 'EEE'),
    count: d.count,
  })) ?? []

  const aiProviders = data?.ai.byProvider ?? []

  return (
    <AppShell onNewNote={() => createMutation.mutate()}>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Dashboard
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your workspace at a glance</p>
          </div>
          <button
            onClick={() => createMutation.mutate()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--brand)', color: 'white' }}>
            <Plus size={15} /> New Note
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="p-5 rounded-2xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: s.bg }}>
                  <s.icon size={17} style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {s.value}
              </p>
              <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Weekly activity chart */}
          <div className="lg:col-span-2 p-6 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                Weekly Activity
              </h2>
              <span className="text-xs px-2 py-1 rounded-lg"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                Last 7 days
              </span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={28}>
                <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(242,84,66,0.05)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.count > 0 ? 'var(--brand)' : 'var(--bg-elevated)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI usage by provider */}
          <div className="p-6 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="font-semibold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              AI Providers
            </h2>
            {aiProviders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Sparkles size={24} className="mb-2" style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Generate summaries to see provider stats</p>
              </div>
            ) : (
              <div className="space-y-4">
                {aiProviders.map((p) => {
                  const total = aiProviders.reduce((s, x) => s + x.count, 0)
                  const pct = Math.round((p.count / total) * 100)
                  const colors: Record<string, string> = { gemini: '#4285f4', groq: '#f97316' }
                  const color = colors[p.provider] ?? 'var(--accent-blue)'
                  return (
                    <div key={p.provider}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                          {p.provider}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.count} calls</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent notes */}
          <div className="p-6 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                Recent Notes
              </h2>
              <Link href="/notes" className="text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
                style={{ color: 'var(--brand)' }}>
                View all <ArrowRight size={11} />
              </Link>
            </div>
            {data?.recentNotes?.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notes yet</p>
            ) : (
              <div className="space-y-3">
                {data?.recentNotes?.map((note) => (
                  <Link key={note.id} href={`/notes/${note.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl transition-all"
                      style={{ border: '1px solid transparent' }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'var(--bg-elevated)'
                        e.currentTarget.style.borderColor = 'var(--border)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.borderColor = 'transparent'
                      }}>
                      <div className="w-8 h-8 rounded-lg flex-shrink-0"
                        style={{ background: note.color && note.color !== '#ffffff' ? note.color : 'var(--bg-elevated)' }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{note.title}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(note.updatedAt)}</p>
                      </div>
                      <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{note.wordCount}w</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Top Tags */}
          <div className="p-6 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="font-semibold mb-5" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Most Used Tags
            </h2>
            {data?.topTags?.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tags yet</p>
            ) : (
              <div className="space-y-3">
                {data?.topTags?.slice(0, 6).map((tag, i) => {
                  const maxCount = data.topTags[0]?.count ?? 1
                  return (
                    <div key={tag.id} className="flex items-center gap-3">
                      <span className="text-xs w-4 text-right flex-shrink-0"
                        style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                            #{tag.name}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{tag.count}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                          <div className="h-full rounded-full"
                            style={{ width: `${(tag.count / maxCount) * 100}%`, background: tag.color }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
