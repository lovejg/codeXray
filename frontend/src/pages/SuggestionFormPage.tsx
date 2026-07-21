import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiErrorMessage } from '../lib/apiError'
import { Lock } from 'lucide-react'
import { communityApi } from '../api/community'
import type { PostType } from '../types'
import { POST_TYPE_LABEL, SUGGESTION_POST_TYPES } from '../types'
import ProblemSelect from '../components/common/ProblemSelect'

const TYPES = SUGGESTION_POST_TYPES.map((t) => [t, POST_TYPE_LABEL[t]] as [PostType, string])

const TYPE_HINT: Record<PostType, string> = {
  QUESTION: '',
  SOLUTION_SHARE: '',
  FEEDBACK: '어떤 문제의 레벨/태그가 부적절한지 설명해주세요.',
  BUG_REPORT: '어떤 페이지/기능에서 어떤 문제가 발생했는지 알려주세요. 재현 절차까지 있으면 베스트.',
  FEATURE_REQUEST: '어떤 기능이 추가되면 좋을지, 왜 필요한지 설명해주세요.',
}

export default function SuggestionFormPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState({
    type: 'FEEDBACK' as PostType,
    title: '',
    content: '',
    problemId: '' as number | '',
    isPrivate: false,
  })
  const [error, setError] = useState('')

  // 레벨/태그 의견만 특정 문제와 묶임. 버그/기능요청은 일반 건이라 문제 선택 불필요.
  const showProblemSelect = form.type === 'FEEDBACK'

  const mutation = useMutation({
    mutationFn: () =>
      communityApi.createPost({
        type: form.type,
        title: form.title,
        content: form.content,
        isPrivate: form.isPrivate,
        ...(showProblemSelect && form.problemId !== '' && { problemId: Number(form.problemId) }),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['posts'] })
      navigate(`/suggestions/${data.id}`)
    },
    onError: (err) => setError(getApiErrorMessage(err, '오류가 발생했습니다.')),
  })

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <h1 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>건의 남기기</h1>

      <div className="rounded-xl border p-6 flex flex-col gap-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {/* 건의 유형 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>건의 유형</label>
          <div className="flex gap-2 flex-wrap">
            {TYPES.map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setForm({ ...form, type: val })}
                className="px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer border"
                style={{
                  background: form.type === val ? 'var(--accent)' : 'var(--bg-hover)',
                  color: form.type === val ? '#fff' : 'var(--text)',
                  borderColor: form.type === val ? 'var(--accent)' : 'var(--border)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {TYPE_HINT[form.type] && (
            <p className="text-xs mt-1" style={{ color: 'var(--text)', opacity: 0.7 }}>
              {TYPE_HINT[form.type]}
            </p>
          )}
        </div>

        {/* 연관 문제 */}
        {showProblemSelect && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>연관 문제 (선택)</label>
            <ProblemSelect
              value={form.problemId}
              onChange={(v) => setForm({ ...form, problemId: v })}
            />
          </div>
        )}

        {/* 제목 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>제목</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="px-3 py-2 rounded-lg text-sm outline-none border"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-h)' }}
            placeholder="제목을 입력하세요"
            required
          />
        </div>

        {/* 내용 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>내용</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={10}
            className="px-3 py-2 rounded-lg text-sm outline-none resize-none border"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-h)' }}
            placeholder="내용을 입력하세요"
          />
        </div>

        {/* 비공개 옵션 */}
        <label className="flex items-start gap-2.5 cursor-pointer select-none p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: form.isPrivate ? 'var(--bg-hover)' : 'transparent' }}>
          <input
            type="checkbox"
            checked={form.isPrivate}
            onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
            className="mt-0.5 cursor-pointer"
          />
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--text-h)' }}>
              <Lock size={13} /> 관리자만 볼 수 있게
            </div>
            <p className="text-xs" style={{ color: 'var(--text)', opacity: 0.8 }}>
              체크 시 다른 사용자에게는 이 건의가 보이지 않습니다. 본인과 관리자만 열람 가능.
            </p>
          </div>
        </label>

        {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

        <div className="flex gap-2 justify-end">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg text-sm cursor-pointer"
            style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
          >
            취소
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.title.trim() || !form.content.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-60"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {mutation.isPending ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
