'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function HomePage() {
  const router = useRouter()
  const { token } = useAuthStore()

  useEffect(() => {
    if (token) {
      router.replace('/dashboard')
    } else {
      router.replace('/auth/login')
    }
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse"
          style={{ background: 'var(--brand)' }}>
          <span className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>P</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    </div>
  )
}
