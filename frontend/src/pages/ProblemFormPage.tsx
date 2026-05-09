import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { problemsApi } from '../api/problems'
import { tagsApi } from '../api/tags'
import type { ProblemSource } from '../types'
import { SOURCE_LABEL } from '../types'

const SOURCES = Object.entries(SOURCE_LABEL) as [ProblemSource, string][]

export default function ProblemFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    title: '',
    source: 'PRACTICE' as ProblemSource,
    level: 1,
    link: '',
    tagIds: [] as number[],
  })
  const [error, setError] = useState('')

  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.getAll })
  const { data: problem } = useQuery({
    queryKey: ['problem', id],
    queryFn: () => problemsApi.getOne(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    if (problem) {
      setForm({
        title: problem.title,
        source: problem.source,
        level: problem.level,
        link: problem.link,
        tagIds: problem.tags.map((t: any) => t.tag.id),
      })
    }
  }, [problem])

  const mutation = useMutation({
    mutationFn: () =>
      isEdit ? problemsApi.update(Number(id), form) : problemsApi.create(form),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['problems'] })
      qc.invalidateQueries({ queryKey: ['problem', id] })
      navigate(`/problems/${data.id}`)
    },
    onError: (err: any) => setError(err.response?.data?.message ?? '오류가 발생했습니다.'),
  })

  const toggleTag = (tagId: number) => {
    setForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(tagId)
        ? f.tagIds.filter((t) => t !== tagId)
        : [...f.tagIds, tagId],
    }))
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <h1 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>
        {isEdit ? '문제 수정' : '문제 추가'}
      </h1>

      <div className="rounded-xl border p-6 flex flex-col gap-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {/* 문제명 */}
        <Field label="문제명">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input"
            style={inputStyle}
            placeholder="두 수의 합"
            required
          />
        </Field>

        {/* 출처 */}
        <Field label="출처">
          <select
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value as ProblemSource })}
            style={inputStyle}
            className="rounded-lg px-3 py-2 text-sm outline-none border"
          >
            {SOURCES.map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </Field>

        {/* 레벨 */}
        <Field label={`레벨: Lv.${form.level}`}>
          <input
            type="range"
            min={0}
            max={5}
            value={form.level}
            onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}
            className="w-full accent-purple-500"
          />
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text)' }}>
            {[0,1,2,3,4,5].map((l) => <span key={l}>Lv.{l}</span>)}
          </div>
        </Field>

        {/* 문제 링크 */}
        <Field label="프로그래머스 링크">
          <input
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            style={inputStyle}
            className="rounded-lg px-3 py-2 text-sm outline-none border"
            placeholder="https://school.programmers.co.kr/..."
          />
        </Field>

        {/* 알고리즘 태그 */}
        <Field label="알고리즘 태그">
          <div className="flex flex-wrap gap-2">
            {tags.map((t: any) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className="px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer"
                style={{
                  background: form.tagIds.includes(t.id) ? 'var(--accent)' : 'var(--bg-hover)',
                  color: form.tagIds.includes(t.id) ? '#fff' : 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              >
                {t.name}
              </button>
            ))}
            {tags.length === 0 && (
              <p className="text-xs" style={{ color: 'var(--text)' }}>
                태그가 없습니다. 먼저 태그를 추가해주세요.
              </p>
            )}
          </div>
        </Field>

        {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg text-sm cursor-pointer"
            style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
          >
            취소
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-60"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {mutation.isPending ? '저장 중...' : isEdit ? '수정 완료' : '추가하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg)',
  borderColor: 'var(--border)',
  color: 'var(--text-h)',
  width: '100%',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</label>
      {children}
    </div>
  )
}
