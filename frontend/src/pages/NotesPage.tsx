import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit3, ChevronDown, ChevronUp, Search } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { notesApi } from '../api/notes'
import { useAuthStore } from '../store/authStore'
import { Link } from 'react-router-dom'
import type { Note, NoteType } from '../types'
import { NOTE_TYPE_LABEL, NOTE_TYPE_COLOR } from '../types'

const TYPES = Object.entries(NOTE_TYPE_LABEL) as [NoteType, string][]
const LANGS = ['python', 'javascript', 'typescript', 'java', 'cpp', 'c', 'kotlin', 'swift', 'go']

const emptyForm = {
  type: 'CODE' as NoteType,
  title: '',
  body: '',
  language: 'python',
  tagsInput: '',
}

export default function NotesPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [typeFilter, setTypeFilter] = useState<NoteType | ''>('')
  const [search, setSearch] = useState('')

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', typeFilter, search],
    queryFn: () =>
      notesApi.getAll({
        ...(typeFilter && { type: typeFilter }),
        ...(search && { search }),
      }),
    enabled: !!user,
  })

  const buildPayload = () => ({
    type: form.type,
    title: form.title,
    body: form.body,
    ...(form.type === 'CODE' && form.language ? { language: form.language } : {}),
    tags: form.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  })

  const createMutation = useMutation({
    mutationFn: () => notesApi.create(buildPayload()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => notesApi.update(editId!, buildPayload()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  })

  const resetForm = () => {
    setForm(emptyForm)
    setShowForm(false)
    setEditId(null)
  }

  const startEdit = (n: Note) => {
    setForm({
      type: n.type,
      title: n.title,
      body: n.body,
      language: n.language ?? 'python',
      tagsInput: n.tags.join(', '),
    })
    setEditId(n.id)
    setShowForm(true)
  }

  const bodyPlaceholder: Record<NoteType, string> = {
    CODE: '```python\ndef bfs(start):\n    ...\n```\n\n설명을 함께 적어도 좋아요.',
    PATTERN: '- **언제 쓰나**: N ≤ 20 이고 ...\n- **접근 순서**: 1) 정렬 → 2) 투포인터\n- **주의할 점**: ...',
    MISTAKE: '## 문제\n어떤 상황이었나?\n\n## 원인\n왜 틀렸는지\n\n## 교훈\n다음엔 이렇게',
    OTHER: '## bisect (파이썬)\n- `bisect_left(a, x)`: x 삽입 위치 (같은 값이 있으면 왼쪽)\n- `bisect_right(a, x)`: 오른쪽\n\n## <algorithm> (C++)\n```cpp\n#include <algorithm>\nsort(v.begin(), v.end());\nint idx = lower_bound(v.begin(), v.end(), x) - v.begin();\n```\n\n라이브러리 사용법, 헤더, 자주 쓰는 치트시트 등 자유롭게.',
  }

  if (!user)
    return (
      <div className="text-center py-20" style={{ color: 'var(--text)' }}>
        <p>로그인이 필요합니다.</p>
        <Link to="/login" className="mt-3 inline-block text-sm" style={{ color: 'var(--accent-light)' }}>
          로그인하기
        </Link>
      </div>
    )

  if (showForm) {
    return (
      <div className="flex flex-col gap-5">
        <div
          className="rounded-xl border p-5 flex flex-col gap-4"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--accent-border)' }}
        >
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>
            {editId ? '노트 수정' : '새 노트'}
          </h2>

          {/* 타입 선택 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs" style={{ color: 'var(--text)' }}>유형 *</label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setForm({ ...form, type: val })}
                  className="px-3 py-1.5 rounded-lg text-xs cursor-pointer border"
                  style={{
                    background: form.type === val ? NOTE_TYPE_COLOR[val].bg : 'var(--bg-hover)',
                    borderColor: form.type === val ? NOTE_TYPE_COLOR[val].text : 'var(--border)',
                    color: form.type === val ? NOTE_TYPE_COLOR[val].text : 'var(--text)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs" style={{ color: 'var(--text)' }}>제목 *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="px-3 py-2 rounded-lg text-sm outline-none border"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-h)' }}
                placeholder="BFS 템플릿"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs" style={{ color: 'var(--text)' }}>태그 (쉼표로 구분)</label>
              <input
                value={form.tagsInput}
                onChange={(e) => setForm({ ...form, tagsInput: e.target.value })}
                className="px-3 py-2 rounded-lg text-sm outline-none border"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-h)' }}
                placeholder="BFS, 그래프"
              />
            </div>
          </div>

          {form.type === 'CODE' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs" style={{ color: 'var(--text)' }}>주 언어</label>
              <div className="flex gap-2 flex-wrap">
                {LANGS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setForm({ ...form, language: l })}
                    className="px-2.5 py-1 rounded text-xs cursor-pointer"
                    style={{
                      background: form.language === l ? 'var(--accent)' : 'var(--bg-hover)',
                      color: form.language === l ? '#fff' : 'var(--text)',
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs" style={{ color: 'var(--text)' }}>
              본문 * <span style={{ opacity: 0.6 }}>(마크다운 지원: ``` 코드블록, **굵게**, - 목록, # 제목)</span>
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={14}
              placeholder={bodyPlaceholder[form.type]}
              className="px-3 py-2 rounded-lg text-sm outline-none resize-y border font-mono"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: '#e2e8f0' }}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded-lg text-sm cursor-pointer"
              style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
            >
              취소
            </button>
            <button
              onClick={() => (editId ? updateMutation.mutate() : createMutation.mutate())}
              disabled={!form.title.trim() || !form.body.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-60"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {editId ? '수정 완료' : '저장'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>나만의 노트</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text)' }}>
            코드 템플릿, 접근 패턴, 오답 노트, 기타를 한 곳에
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditId(null)
            setForm(emptyForm)
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Plus size={14} />
          노트 추가
        </button>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setTypeFilter('')}
          className="px-3 py-1.5 rounded-lg text-xs cursor-pointer border"
          style={{
            background: typeFilter === '' ? 'var(--accent)' : 'var(--bg-card)',
            borderColor: typeFilter === '' ? 'var(--accent)' : 'var(--border)',
            color: typeFilter === '' ? '#fff' : 'var(--text)',
          }}
        >
          전체
        </button>
        {TYPES.map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTypeFilter(val)}
            className="px-3 py-1.5 rounded-lg text-xs cursor-pointer border"
            style={{
              background: typeFilter === val ? NOTE_TYPE_COLOR[val].bg : 'var(--bg-card)',
              borderColor: typeFilter === val ? NOTE_TYPE_COLOR[val].text : 'var(--border)',
              color: typeFilter === val ? NOTE_TYPE_COLOR[val].text : 'var(--text)',
            }}
          >
            {label}
          </button>
        ))}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border ml-auto w-64"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <Search size={14} style={{ color: 'var(--text)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제목·본문 검색"
            className="bg-transparent outline-none text-xs w-full"
            style={{ color: 'var(--text-h)' }}
          />
        </div>
      </div>

      {/* 노트 목록 */}
      {isLoading ? (
        <div className="text-center py-20" style={{ color: 'var(--text)' }}>불러오는 중...</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--text)' }}>
          {typeFilter || search ? '조건에 맞는 노트가 없습니다.' : '노트가 없습니다. "노트 추가"로 시작해보세요.'}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((n: Note) => {
            const colors = NOTE_TYPE_COLOR[n.type]
            const isOpen = expanded === n.id
            return (
              <div
                key={n.id}
                className="rounded-xl border overflow-hidden"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between px-4 py-3 gap-2">
                  <button
                    className="flex items-center gap-3 flex-1 text-left cursor-pointer min-w-0"
                    onClick={() => setExpanded(isOpen ? null : n.id)}
                  >
                    <span
                      className="text-xs px-2 py-0.5 rounded font-medium shrink-0"
                      style={{ background: colors.bg, color: colors.text }}
                    >
                      {NOTE_TYPE_LABEL[n.type]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate" style={{ color: 'var(--text-h)' }}>
                        {n.title}
                      </p>
                      {n.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {n.tags.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {n.type === 'CODE' && n.language && (
                      <span
                        className="text-xs px-2 py-0.5 rounded shrink-0"
                        style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
                      >
                        {n.language}
                      </span>
                    )}
                    {isOpen ? (
                      <ChevronUp size={15} style={{ color: 'var(--text)', flexShrink: 0 }} />
                    ) : (
                      <ChevronDown size={15} style={{ color: 'var(--text)', flexShrink: 0 }} />
                    )}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(n)}
                      className="p-2 cursor-pointer"
                      style={{ color: 'var(--text)' }}
                      aria-label="수정"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('삭제할까요?')) deleteMutation.mutate(n.id)
                      }}
                      className="p-2 cursor-pointer"
                      style={{ color: 'var(--text)' }}
                      aria-label="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div
                    className="px-5 py-4 border-t markdown-body"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-h)' }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{n.body}</ReactMarkdown>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
