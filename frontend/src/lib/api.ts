import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('peblo_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('peblo_token')
      localStorage.removeItem('peblo_user')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

// ─── Notes API ────────────────────────────────────────────────────────────────
export const notesApi = {
  list: (params?: {
    search?: string
    tag?: string
    archived?: boolean
    sort?: string
    page?: number
    limit?: number
  }) => api.get('/notes', { params }),

  get: (id: string) => api.get(`/notes/${id}`),

  create: (data: { title?: string; content?: string; tags?: string[]; color?: string }) =>
    api.post('/notes', data),

  update: (
    id: string,
    data: {
      title?: string
      content?: string
      tags?: string[]
      color?: string
      isArchived?: boolean
      isPinned?: boolean
    }
  ) => api.patch(`/notes/${id}`, data),

  delete: (id: string) => api.delete(`/notes/${id}`),

  generateSummary: (id: string) => api.post(`/notes/${id}/generate-summary`),

  share: (id: string) => api.post(`/notes/${id}/share`),

  revokeShare: (id: string) => api.delete(`/notes/${id}/share`),
}

// ─── Shared API ───────────────────────────────────────────────────────────────
export const sharedApi = {
  get: (shareId: string) => api.get(`/shared/${shareId}`),
}

// ─── Dashboard API ────────────────────────────────────────────────────────────
export const dashboardApi = {
  insights: () => api.get('/dashboard/insights'),
  tags: () => api.get('/dashboard/tags'),
}

export default api
