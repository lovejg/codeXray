import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiErrorMessage } from '../lib/apiError'
import { Wand2 } from 'lucide-react'
import { communityApi } from '../api/community'
import type { PostType } from '../types'
import { POST_TYPE_LABEL, COMMUNITY_POST_TYPES } from '../types'
import ProblemSelect from '../components/common/ProblemSelect'
import CodeEditor from '../components/common/CodeEditor'
import { detectLanguage } from '../utils/detectLanguage'

const TYPES = COMMUNITY_POST_TYPES.map((t) => [t, POST_TYPE_LABEL[t]] as [PostType, string])
const LANGS = ['python', 'javascript', 'typescript', 'java', 'cpp', 'c', 'kotlin', 'swift', 'go']

export default function CommunityFormPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [params] = useSearchParams()

  const initialType = (params.get('type') as PostType) || 'QUESTION'
  const initialProblemId = params.get('problemId')

  const [type, setType] = useState<PostType>(
    COMMUNITY_POST_TYPES.includes(initialType) ? initialType : 'QUESTION',
  )
  const [title, setTitle] = useState('')
  const [problemId, setProblemId] = useState<number | ''>(
    initialProblemId ? Number(initialProblemId) : '',
  )
  // 질문용: 마크다운 내용
  const [content, setContent] = useState('')
  // 풀이 공유용: 설명 + 코드 + 언어
  const [description, setDescription] = useState('')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('python')
  const [languageTouched, setLanguageTouched] = useState(false)
  const [lastDetected, setLastDetected] = useState<string | null>(null)
  const [error, setError] = useState('')

  // 코드 변경 시 언어 자동 감지 (사용자가 직접 고른 적 없을 때만)
  const handleCodeChange = (val: string) => {
    setCode(val)
    if (languageTouched) return
    const guess = detectLanguage(val)
    if (guess && guess !== lastDetected) {
      setLastDetected(guess)
      setLanguage(guess)
    }
  }

  const isShare = type === 'SOLUTION_SHARE'

  // 풀이 공유의 경우 content = 설명 + fenced 코드 블록
  const buildContent = () => {
    if (!isShare) return content
    const trimmedDesc = description.trim()
    const block = `\`\`\`${language}\n${code.trimEnd()}\n\`\`\``
    return trimmedDesc ? `${trimmedDesc}\n\n${block}` : block
  }

  const canSubmit = (() => {
    if (!title.trim()) return false
    if (isShare) return code.trim().length > 0
    return content.trim().length > 0
  })()

  const mutation = useMutation({
    mutationFn: () =>
      communityApi.createPost({
        type,
        title,
        content: buildContent(),
        ...(problemId !== '' && { problemId: Number(problemId) }),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['posts'] })
      navigate(`/community/${data.id}`)
    },
    onError: (err) => setError(getApiErrorMessage(err, '오류가 발생했습니다.')),
  })

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <h1 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>글 작성</h1>

      <div className="rounded-xl border p-6 flex flex-col gap-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {/* 게시글 타입 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>카테고리</label>
          <div className="flex gap-2">
            {TYPES.map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setType(val)}
                className="px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer"
                style={{
                  background: type === val ? 'var(--accent)' : 'var(--bg-hover)',
                  color: type === val ? '#fff' : 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 연관 문제 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            연관 문제 {isShare ? '' : '(선택)'}
          </label>
          <ProblemSelect value={problemId} onChange={setProblemId} />
          {isShare && problemId === '' && (
            <p className="text-xs" style={{ color: 'var(--text)', opacity: 0.7 }}>
              풀이 공유는 어떤 문제인지 알려주면 훨씬 도움돼요.
            </p>
          )}
        </div>

        {/* 제목 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none border"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-h)' }}
            placeholder={isShare ? '예: 우선순위 큐로 O(n log n) 풀이' : '제목을 입력하세요'}
            required
          />
        </div>

        {isShare ? (
          <>
            {/* 설명 (선택) */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>설명 (선택)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="px-3 py-2 rounded-lg text-sm outline-none resize-none border"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-h)' }}
                placeholder={'풀이 아이디어나 핵심 접근 방식을 간단히 적어주세요. (선택)\n마크다운 지원 — 백틱으로 `변수명` 같은 인라인 코드도 가능해요.'}
              />
            </div>

            {/* 언어 선택 */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>언어</label>
                {!languageTouched && lastDetected && (
                  <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.7 }}>
                    코드에서 자동 감지 — 다르면 클릭해서 바꾸기
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {LANGS.map((l) => {
                  const isActive = language === l
                  const isAutoDetected = isActive && !languageTouched && lastDetected === l
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => { setLanguageTouched(true); setLanguage(l) }}
                      className="px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                      style={{
                        background: isAutoDetected ? 'rgba(96, 165, 250, 0.15)' : isActive ? 'var(--accent)' : 'var(--bg-hover)',
                        color: isAutoDetected ? 'var(--accent-light)' : isActive ? '#fff' : 'var(--text)',
                        border: isAutoDetected ? '1px solid var(--accent-light)' : '1px solid var(--border)',
                      }}
                    >
                      {isAutoDetected && <Wand2 size={10} />}
                      {l}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 코드 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>풀이 코드</label>
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                <div className="px-4 py-2 text-xs border-b flex items-center justify-between" style={{ background: 'var(--bg-hover)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                  <span>{language}</span>
                  <span>{code ? code.split('\n').length : 0} lines</span>
                </div>
                <CodeEditor
                  value={code}
                  onChange={handleCodeChange}
                  language={language}
                  minHeight="360px"
                  placeholder="# 코드를 붙여넣거나 입력하세요"
                />
              </div>
            </div>
          </>
        ) : (
          /* 질문: 마크다운 textarea */
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="px-3 py-2 rounded-lg text-sm outline-none resize-none border font-mono"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-h)' }}
              placeholder={`내용을 입력하세요.\n\n코드는 아래처럼 감싸주세요:\n\`\`\`python\ndef solution(n):\n    return n * 2\n\`\`\`\n\n짧은 표현은 \`print()\` 처럼 백틱으로 감싸면 인라인 코드가 돼요.`}
            />
            <p className="text-xs" style={{ color: 'var(--text)', opacity: 0.7 }}>
              <span style={{ fontFamily: 'monospace' }}>```python</span>, <span style={{ fontFamily: 'monospace' }}>```javascript</span> 등으로 언어를 지정하면 문법 강조가 적용됩니다.
            </p>
          </div>
        )}

        {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}

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
            disabled={mutation.isPending || !canSubmit}
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
