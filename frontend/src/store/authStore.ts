import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: string
}

interface AuthStore {
  user: User | null
  token: string | null
  isLoading: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      setAuth: (user, token) => {
        localStorage.setItem('peblo_token', token)
        set({ user, token })
      },

      logout: () => {
        localStorage.removeItem('peblo_token')
        localStorage.removeItem('peblo_user')
        set({ user: null, token: null })
      },

      fetchMe: async () => {
        try {
          set({ isLoading: true })
          const res = await authApi.me()
          set({ user: res.data.user })
        } catch {
          get().logout()
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'peblo_auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
