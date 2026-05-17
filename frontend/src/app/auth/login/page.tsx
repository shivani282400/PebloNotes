'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await authApi.login(form)
      const { token, user } = res.data
      // Manually set localStorage too
      localStorage.setItem('peblo_token', token)
      setAuth(user, token)
      toast.success(`Welcome back, ${user.name}!`)
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left panel - decorative */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0a08 100%)' }}>
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'var(--brand)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'var(--accent-blue)' }} />

        <div className="relative z-10">
          <Logo />
        </div>

        <div className="relative z-10 space-y-6">
          <blockquote className="text-2xl font-bold leading-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            "Think better. <br />Write faster. <br /><span className="gradient-text">Know more."</span>
          </blockquote>
          <div className="flex gap-3">
            {['AI Summaries', 'Smart Tags', 'Insights'].map((f) => (
              <span key={f} className="tag-pill" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>{f}</span>
            ))}
          </div>
        </div>

        {/* Floating note cards */}
        <div className="absolute top-32 right-8 w-52 p-4 rounded-2xl rotate-6 opacity-30"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <div className="h-2 w-24 rounded mb-2" style={{ background: 'var(--border-strong)' }} />
          <div className="h-2 w-36 rounded mb-1" style={{ background: 'var(--border)' }} />
          <div className="h-2 w-28 rounded" style={{ background: 'var(--border)' }} />
        </div>
        <div className="absolute top-48 right-24 w-40 p-3 rounded-xl -rotate-3 opacity-20"
          style={{ background: 'var(--brand-dim)', border: '1px solid var(--brand)' }}>
          <div className="h-2 w-20 rounded mb-1" style={{ background: 'var(--brand)' }} />
          <div className="h-2 w-28 rounded" style={{ background: 'var(--border-strong)' }} />
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="lg:hidden mb-8"><Logo /></div>

          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Welcome back
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--brand)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm pr-12 transition-all"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--brand)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background: isLoading ? 'var(--bg-elevated)' : 'var(--brand)',
                color: isLoading ? 'var(--text-muted)' : 'white',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link href="/auth/signup" className="font-semibold transition-colors"
              style={{ color: 'var(--brand)' }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: 'var(--brand)' }}>
        <Sparkles size={18} className="text-white" />
      </div>
      <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
        Peblo Notes
      </span>
    </div>
  )
}
