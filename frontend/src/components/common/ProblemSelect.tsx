import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Search, X } from 'lucide-react'
import { problemsApi } from '../../api/problems'

interface ProblemLite {
  id: number
  title: string
}

interface Props {
  value: number | ''
  onChange: (value: number | '') => void
  placeholder?: string
}

export default function ProblemSelect({ value, onChange, placeholder = '문제 검색...' }: Props) {
  const { data: problemsData } = useQuery({
    queryKey: ['problems', 'all'],
    queryFn: () => problemsApi.getAll({ pageSize: 2000 }),
  })
  const problems: ProblemLite[] = useMemo(() => problemsData?.items ?? [], [problemsData])

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = useMemo(
    () => (value === '' ? null : problems.find((p) => p.id === value) ?? null),
    [value, problems],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return problems.slice(0, 200)
    return problems.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 200)
  }, [query, problems])

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
      // 드롭다운을 열 때 하이라이트를 첫 항목으로 초기화
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveIndex(0)
    }
  }, [open])

  const handlePick = (id: number) => {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[activeIndex]) handlePick(filtered[activeIndex].id)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm outline-none border cursor-pointer"
        style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: selected ? 'var(--text-h)' : 'var(--text)' }}
      >
        <span className="truncate text-left">
          {selected ? selected.title : '선택 안 함'}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && (
            <span
              onClick={handleClear}
              role="button"
              aria-label="선택 해제"
              className="p-0.5 rounded hover:bg-white/10 cursor-pointer"
              style={{ color: 'var(--text)' }}
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown size={14} style={{ color: 'var(--text)' }} />
        </span>
      </button>

      {open && (
        <div
          className="absolute z-20 left-0 right-0 mt-1 rounded-lg border shadow-lg flex flex-col"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <Search size={14} style={{ color: 'var(--text)' }} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
              onKeyDown={handleKey}
              placeholder={placeholder}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--text-h)' }}
            />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-xs text-center" style={{ color: 'var(--text)' }}>
                검색 결과가 없습니다.
              </div>
            ) : (
              filtered.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => handlePick(p.id)}
                  className="w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors"
                  style={{
                    background: i === activeIndex ? 'var(--bg-hover)' : 'transparent',
                    color: value === p.id ? 'var(--accent-light)' : 'var(--text-h)',
                  }}
                >
                  {p.title}
                </button>
              ))
            )}
          </div>
          {!query && problems.length > 200 && (
            <div className="px-3 py-1.5 text-[10px] border-t text-center" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
              상위 200개만 표시 중 — 검색어를 입력해주세요
            </div>
          )}
        </div>
      )}
    </div>
  )
}
