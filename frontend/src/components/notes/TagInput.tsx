'use client'
import { useState, KeyboardEvent } from 'react'
import { X, Tag } from 'lucide-react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function TagInput({ tags, onChange, placeholder = 'Add tag…' }: TagInputProps) {
  const [input, setInput] = useState('')

  const addTag = (val: string) => {
    const clean = val.toLowerCase().trim().replace(/\s+/g, '-')
    if (clean && !tags.includes(clean)) {
      onChange([...tags, clean])
    }
    setInput('')
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-2 min-h-8">
      <Tag size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      {tags.map((tag) => (
        <span
          key={tag}
          className="tag-pill flex items-center gap-1"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          #{tag}
          <button
            onClick={() => removeTag(tag)}
            className="hover:opacity-60 transition-opacity ml-0.5"
            style={{ color: 'inherit' }}
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input && addTag(input)}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="bg-transparent text-xs outline-none min-w-16"
        style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}
      />
    </div>
  )
}
