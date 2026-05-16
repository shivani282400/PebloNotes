'use client'
import { useQuery } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { dashboardApi, notesApi } from '@/lib/api'
import { AppShell } from '@/components/layout/AppShell'
import { InsightData } from '@/types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, LineChart, Line, CartesianGrid, Legend
} from 'recharts'
import { Sparkles, FileText, Hash, TrendingUp, Zap, Brain } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function InsightsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: () => dashboardApi.insights().then((r) => r.data.insights as InsightData),
  })

  const createMutation = useMutation({
    mutationFn: () => notesApi.create({ title: 'Untitled Note', content: '' }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      router.push(`/notes/${res.data.note.id}`)
    },
    onError: () => toast.error('Failed to create note'),
  })

  const chartData = data?.weeklyActivity?.map((d) => ({
    day: formatDate(d.date, 'EEE d'),
    count: d.count,
  })) ?? []

  const PROVIDER_COLORS: Record<string, string> = {
    gemini: '#4285f4',
    groq: '#f97316',
  }

  const pieData = data?.ai.byProvider?.map((p) => ({
    name: p.provider,
    value: p.count,
    color: PROVIDER_COLORS[p.provider] ?? '#6366f1',
  })) ?? []

  const tagBarData = data?.topTags?.slice(0, 8).map((t) => ({
    name: `#${t.name}`,
    count: t.count,
    color: t.color,
  })) ?? []

  if (isLoading) {
    return (
      <AppShell onNewNote={() => createMutation.mutate()}>
        <div className="p-8 space-y-6">
          <div className="h-8 w-48 rounded-xl shimmer" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-40 rounded-2xl shimmer" />)}
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell onNewNote={() => createMutation.mutate()}>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Productivity Insights
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Deep dive into your writing patterns and AI usage
          </p>
        </div>

        {/* Key metrics row */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Active Notes', value: data?.totalNotes ?? 0, icon: FileText, color: 'var(--brand)', bg: 'var(--brand-dim)' },
            { label: 'Total Words', value: (data?.totalWords ?? 0).toLocaleString(), icon: TrendingUp, color: 'var(--accent-blue)', bg: 'rgba(99,102,241,0.1)' },
            { label: 'Total AI Calls', value: data?.ai.totalUsage ?? 0, icon: Brain, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
            { label: 'AI This Week', value: data?.ai.usageThisWeek ?? 0, icon: Zap, color: 'var(--accent-cyan)', bg: 'rgba(34,211,238,0.1)' },
            { label: 'Tags Created', value: data?.topTags?.length ?? 0, icon: Hash, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
            { label: 'Archived Notes', value: data?.archivedNotes ?? 0, icon: FileText, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          ].map((s) => (
            <div key={s.label} className="p-5 rounded-2xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: s.bg }}>
                <s.icon size={17} style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {s.value}
              </p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 7-day line chart */}
          <div className="p-6 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="font-semibold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Notes Activity — Last 7 Days
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="count" stroke="var(--brand)" strokeWidth={2.5} dot={{ fill: 'var(--brand)', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* AI provider pie */}
          <div className="p-6 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="font-semibold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              AI Provider Distribution
            </h2>
            {pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48">
                <Sparkles size={28} className="mb-3" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Generate AI summaries to see data</p>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      dataKey="value" paddingAngle={3}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {pieData.map((p) => (
                    <div key={p.name} className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                      <div>
                        <p className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.value} calls</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tag frequency chart */}
        <div className="p-6 rounded-2xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="font-semibold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Top Tags by Usage
          </h2>
          {tagBarData.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tags created yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tagBarData} layout="vertical" barSize={20}>
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(242,84,66,0.05)' }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {tagBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </AppShell>
  )
}
