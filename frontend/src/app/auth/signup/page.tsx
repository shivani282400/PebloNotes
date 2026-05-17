'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Eye, EyeOff, Sparkles, ArrowRight, Check } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const passwordChecks = [
    { label: 'At least 6 characters', ok: form.password.length >= 6 },
    { label: 'Contains a number', ok: /\d/.test(form.password) },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await authApi.signup(form)
      const { token, user } = res.data
      localStorage.setItem('peblo_token', token)
      setAuth(user, token)
      toast.success('Account created! Welcome to Peblo Notes 🎉')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    outline: 'none',
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8"
      style={{ background: 'var(--bg)' }}>
      {/* Background glow */}
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'var(--brand)' }} />

      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8">
          <Link href="/auth/login" className="flex items-center gap-3 mb-8 w-fit">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--brand)' }}>
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Peblo Notes
            </span>
          </Link>

          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Create your account
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Start writing smarter, today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Full name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
              required
              className="w-full px-4 py-3 rounded-xl text-sm transition-all"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'var(--brand)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl text-sm transition-all"
              style={inputStyle}
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
                placeholder="Min. 6 characters"
                required
                className="w-full px-4 py-3 rounded-xl text-sm pr-12 transition-all"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'var(--brand)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
                style={{ color: 'var(--text-muted)' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.password && (
              <div className="flex flex-col gap-1 pt-1">
                {passwordChecks.map((c) => (
                  <div key={c.label} className="flex items-center gap-2 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors`}
                      style={{ background: c.ok ? '#10b981' : 'var(--bg-elevated)', border: c.ok ? 'none' : '1px solid var(--border)' }}>
                      {c.ok && <Check size={10} className="text-white" />}
                    </div>
                    <span style={{ color: c.ok ? '#10b981' : 'var(--text-muted)' }}>{c.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all mt-2"
            style={{
              background: isLoading ? 'var(--bg-elevated)' : 'var(--brand)',
              color: isLoading ? 'var(--text-muted)' : 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Creating account…</>
            ) : (
              <>Create account <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold" style={{ color: 'var(--brand)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
