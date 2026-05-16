'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import {
  Sparkles, LayoutDashboard, FileText, Archive, Tags,
  BarChart2, LogOut, Plus, User
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/notes', icon: FileText, label: 'All Notes' },
  { href: '/notes?archived=true', icon: Archive, label: 'Archived' },
  { href: '/dashboard/insights', icon: BarChart2, label: 'Insights' },
]

interface SidebarProps {
  onNewNote?: () => void
}

export function Sidebar({ onNewNote }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  return (
    <aside className="w-64 flex flex-col h-full py-6 px-4"
      style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 mb-8">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--brand)' }}>
          <Sparkles size={15} className="text-white" />
        </div>
        <span className="font-bold text-base" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          Peblo Notes
        </span>
      </div>

      {/* New note button */}
      <button
        onClick={onNewNote}
        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl mb-6 text-sm font-semibold transition-all"
        style={{ background: 'var(--brand)', color: 'white' }}
      >
        <Plus size={16} />
        New Note
      </button>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const isActive = item.href === '/notes'
            ? pathname === '/notes' && !pathname.includes('archived')
            : pathname.startsWith(item.href.split('?')[0])
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive ? 'font-semibold' : 'hover:opacity-80'
              )}
              style={{
                background: isActive ? 'var(--brand-dim)' : 'transparent',
                color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
                border: isActive ? '1px solid rgba(242,84,66,0.2)' : '1px solid transparent',
              }}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2"
          style={{ background: 'var(--bg-elevated)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'var(--brand)', color: 'white' }}>
            {getInitials(user?.name ?? 'U')}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm transition-all"
          style={{ color: 'var(--text-muted)' }}
          onMouseOver={(e) => { e.currentTarget.style.color = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-dim)' }}
          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
