import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date: string | Date, fmt = 'MMM d, yyyy') {
  return format(new Date(date), fmt)
}

export function truncate(str: string, maxLength: number) {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trim() + '…'
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const NOTE_COLORS = [
  '#ffffff', // white
  '#fef3c7', // amber
  '#d1fae5', // green
  '#dbeafe', // blue
  '#ede9fe', // violet
  '#fce7f3', // pink
  '#fee2e2', // red
  '#f0fdf4', // mint
]

export const SENTIMENT_CONFIG = {
  positive: { label: 'Positive', color: '#10b981', emoji: '😊' },
  neutral: { label: 'Neutral', color: '#6366f1', emoji: '😐' },
  negative: { label: 'Negative', color: '#f25442', emoji: '😔' },
} as const
