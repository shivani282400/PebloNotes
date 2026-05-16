'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1c1c2e',
            color: '#f0f0f8',
            border: '1px solid #252538',
            borderRadius: '10px',
            fontSize: '14px',
            fontFamily: 'var(--font-body)',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#1c1c2e' },
          },
          error: {
            iconTheme: { primary: '#f25442', secondary: '#1c1c2e' },
          },
        }}
      />
    </QueryClientProvider>
  )
}
