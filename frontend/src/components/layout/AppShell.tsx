'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Sidebar } from './Sidebar'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { notesApi } from '@/lib/api'

interface AppShellProps {
  children: React.ReactNode
  onNewNote?: () => void
}

export function AppShell({ children, onNewNote }: AppShellProps) {
  const router = useRouter()
  const { token } = useAuthStore()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: () => notesApi.create({ title: 'Untitled Note', content: '' }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      router.push(`/notes/${res.data.note.id}`)
    },
    onError: () => toast.error('Failed to create note'),
  })

  useEffect(() => {
    if (!token) router.replace('/auth/login')
  }, [token, router])

  if (!token) return null

  const handleNewNote = onNewNote || (() => createMutation.mutate())

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar onNewNote={handleNewNote} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
