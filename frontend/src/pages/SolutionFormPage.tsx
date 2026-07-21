import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiErrorMessage } from '../lib/apiError'
import { Link2, Check, AlertTriangle, Wand2, ChevronDown, ChevronUp, NotebookPen, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { solutionsApi } from '../api/solutions'
import { problemsApi } from '../api/problems'
import CodeEditor from '../components/common/CodeEditor'
import ProblemSelect from '../components/common/ProblemSelect'
import { detectLanguage, normalizeLanguageKey } from '../utils/detectLanguage'
import { normalizeProgrammersUrl } from '../utils/normalizeProgrammersUrl'

const LANGS = ['python', 'javascript', 'typescript', 'java', 'cpp', 'c', 'kotlin', 'swift', 'go']

export default function SolutionFormPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const problemIdParam = searchParams.get('problemId')
  const problemUrlParam = searchParams.get('problemUrl')
  const codeParam = searchParams.get('code')
  const languageParam = searchParams.get('language')
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const importedLanguage = languageParam ? normalizeLanguageKey(languageParam) : null

  const [form, setForm] = useState({
    problemId: problemIdParam ? Number(problemIdParam) : 0,
    code: codeParam ?? '',
    language: importedLanguage ?? 'python',
  })
  const [memo, setMemo] = useState({
    wrongReason: '', logic: '', keyFunctions: '', freeNote: '',
  })
  const [error, setError] = useState('')
  const [memoOpen, setMemoOpen] = useState(false)

  // 북마클릿/외부에서 언어를 명시했다면 자동 감지가 덮어쓰지 않도록 touched=true 로 시작
  const [languageTouched, setLanguageTouched] = useState(!!importedLanguage)
  const [lastDetected, setLastDetected] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState(problemUrlParam ?? '')
  const [importedFromBookmarklet] = useState(!!(codeParam || problemUrlParam || languageParam))

  const { data: solution } = useQuery({
    queryKey: ['solution', id],
    queryFn: () => solutionsApi.getOne(Number(id)),
    enabled: isEdit,
  })

  const { data: problemsData } = useQuery({
    queryKey: ['problems', 'all'],
    queryFn: () => problemsApi.getAll({ pageSize: 2000 }),
  })
  const allProblems = useMemo(() => problemsData?.items ?? [], [problemsData])

  const { data: problem } = useQuery({
    queryKey: ['problem', form.problemId],
    queryFn: () => problemsApi.getOne(form.problemId),
    enabled: form.problemId > 0,
  })

  // 수정 모드: 불러온 풀이를 폼 초기값으로 하이드레이션
  useEffect(() => {
    if (solution) {
      setForm({ problemId: solution.problemId, code: solution.code, language: solution.language })
      setLanguageTouched(true)
      if (solution.memo) {
        const m = {
          wrongReason: solution.memo.wrongReason ?? '',
          logic: solution.memo.logic ?? '',
          keyFunctions: solution.memo.keyFunctions ?? '',
          freeNote: solution.memo.freeNote ?? '',
        }
        setMemo(m)
        if (Object.values(m).some(Boolean)) setMemoOpen(true)
      }
    }
  }, [solution])

  // 코드 변경 시 언어 자동 감지 (사용자가 직접 고른 적 없을 때만)
  const handleCodeChange = (v: string) => {
    setForm((f) => ({ ...f, code: v }))
    if (languageTouched) return
    const guess = detectLanguage(v)
    if (guess && guess !== lastDetected) {
      setLastDetected(guess)
      setForm((f) => ({ ...f, language: guess }))
    }
  }

  const urlMatch = useMemo(() => {
    const normalized = normalizeProgrammersUrl(urlInput)
    if (!normalized) return null
    const found = allProblems.find((p) => normalizeProgrammersUrl(p.link) === normalized)
    return { normalized, problem: found }
  }, [urlInput, allProblems])

  // URL로 붙여넣은 문제 링크가 매칭되면 problemId 자동 선택.
  // form.problemId를 deps에 넣으면 사용자의 수동 선택과 충돌하므로 의도적으로 제외한다.
  useEffect(() => {
    if (urlMatch?.problem && urlMatch.problem.id !== form.problemId) {
      setForm((f) => ({ ...f, problemId: urlMatch.problem!.id }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlMatch?.problem?.id])

  const solutionMutation = useMutation({
    mutationFn: async () => {
      const sol = isEdit
        ? await solutionsApi.update(Number(id), { code: form.code, language: form.language })
        : await solutionsApi.create(form)
      if (Object.values(memo).some(Boolean)) {
        await solutionsApi.upsertMemo(sol.id, memo)
      }
      return sol
    },
    onSuccess: (sol) => {
      qc.invalidateQueries({ queryKey: ['solutions'] })
      navigate(`/problems/${sol.problemId}`)
    },
    onError: (err) => setError(getApiErrorMessage(err, '오류가 발생했습니다.')),
  })

  const handleLanguagePick = (lang: string) => {
    setLanguageTouched(true)
    setForm({ ...form, language: lang })
  }

  const memoFilledCount = Object.values(memo).filter((v) => v.trim().length > 0).length

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      <h1 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>
        {isEdit ? '풀이 수정' : '풀이 등록'}
      </h1>

      {/* 북마클릿에서 가져온 경우 배너 */}
      {!isEdit && importedFromBookmarklet && (
        <div
          className="flex items-start gap-2 rounded-lg p-3 border"
          style={{ background: 'rgba(96, 165, 250, 0.08)', borderColor: 'var(--accent-light)' }}
        >
          <Sparkles size={14} style={{ color: 'var(--accent-light)', marginTop: 2 }} />
          <p className="text-xs" style={{ color: 'var(--text-h)' }}>
            북마클릿에서 가져온 데이터로 폼이 자동 채워졌습니다. 확인 후 저장하세요.
          </p>
        </div>
      )}

      {/* 문제 선택 (수정 모드 아닐 때만) */}
      {!isEdit && (
        <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
              <Link2 size={14} />
              프로그래머스 URL 붙여넣기
            </label>
            <Link to="/import" className="text-[11px] hover:underline" style={{ color: 'var(--accent-light)' }}>
              💡 북마클릿으로 더 빠르게
            </Link>
          </div>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://school.programmers.co.kr/learn/courses/30/lessons/..."
            className="px-3 py-2 rounded-lg text-sm outline-none border"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-h)' }}
          />

          {/* URL 매칭 결과 — 성공 시 명확한 배너로 표시 */}
          {urlMatch?.problem && (
            <div
              className="flex items-start gap-2 rounded-lg p-3 border"
              style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: '#10b981' }}
            >
              <Wand2 size={14} style={{ color: '#10b981', marginTop: 2 }} />
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-[11px] font-medium" style={{ color: '#10b981' }}>URL 에서 문제 자동 인식됨</span>
                <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-h)' }}>
                  {urlMatch.problem.title}
                </span>
              </div>
            </div>
          )}
          {urlInput.trim() && !urlMatch?.problem && (
            <UrlMatchHint normalized={urlMatch?.normalized ?? null} />
          )}

          <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
            <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text)', opacity: 0.7 }}>또는 직접 선택</span>
            <div className="flex-1">
              <ProblemSelect
                value={form.problemId === 0 ? '' : form.problemId}
                onChange={(v) => {
                  // 직접 고른 경우 URL 자동 매칭 표시 해제 (혼동 방지)
                  setUrlInput('')
                  setForm({ ...form, problemId: v === '' ? 0 : v })
                }}
              />
            </div>
          </div>

          {/* URL 매칭 없이 직접 선택했을 때만 별도 확인 */}
          {problem && !urlMatch?.problem && (
            <p className="text-xs flex items-center gap-1.5 pt-1 border-t" style={{ color: '#10b981', borderColor: 'var(--border)' }}>
              <Check size={11} />
              선택됨: <span className="font-medium" style={{ color: 'var(--text-h)' }}>{problem.title}</span>
            </p>
          )}
        </div>
      )}

      {isEdit && problem && (
        <div className="px-4 py-3 rounded-lg text-sm flex items-center gap-2" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', border: '1px solid var(--border)', color: 'var(--text-h)' }}>
          <Check size={14} style={{ color: '#10b981' }} />
          <span>문제: <span className="font-medium">{problem.title}</span></span>
        </div>
      )}

      {/* 코드 섹션 — 언어 + 에디터 한 카드 */}
      <div className="rounded-xl border overflow-hidden flex flex-col" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="px-4 py-3 border-b flex flex-col gap-2.5" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm font-medium" style={{ color: 'var(--text-h)' }}>풀이 코드</span>
            <span className="text-xs tabular-nums" style={{ color: 'var(--text)', opacity: 0.7 }}>
              {form.code ? form.code.split('\n').length : 0} lines
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {LANGS.map((l) => {
              const isActive = form.language === l
              const isAutoDetected = isActive && !languageTouched && lastDetected === l
              return (
                <button
                  key={l}
                  onClick={() => handleLanguagePick(l)}
                  className="px-2.5 py-1 rounded text-[11px] cursor-pointer transition-colors flex items-center gap-1"
                  style={{
                    background: isAutoDetected ? 'rgba(96, 165, 250, 0.15)' : isActive ? 'var(--accent)' : 'var(--bg-hover)',
                    color: isAutoDetected ? 'var(--accent-light)' : isActive ? '#fff' : 'var(--text)',
                    border: isAutoDetected ? '1px solid var(--accent-light)' : '1px solid var(--border)',
                  }}
                >
                  {isAutoDetected && <Wand2 size={9} />}
                  {l}
                </button>
              )
            })}
            {!languageTouched && lastDetected && (
              <span className="text-[10px] ml-auto" style={{ color: 'var(--text)', opacity: 0.7 }}>
                코드에서 자동 감지 — 다르면 클릭해서 바꾸기
              </span>
            )}
          </div>
        </div>
        <CodeEditor
          value={form.code}
          onChange={handleCodeChange}
          language={form.language}
          minHeight="440px"
          placeholder="# 풀이 코드를 붙여넣거나 입력하세요"
        />
      </div>

      {/* 메모 — 접힘 (선택사항) */}
      <div className="rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={() => setMemoOpen((o) => !o)}
          className="w-full px-5 py-3 flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-h)' }}>
            <NotebookPen size={14} />
            메모
            <span className="text-xs font-normal" style={{ color: 'var(--text)', opacity: 0.7 }}>
              {memoFilledCount > 0 ? `${memoFilledCount}개 작성됨` : '선택'}
            </span>
          </span>
          {memoOpen ? <ChevronUp size={15} style={{ color: 'var(--text)' }} /> : <ChevronDown size={15} style={{ color: 'var(--text)' }} />}
        </button>
        {memoOpen && (
          <div className="px-5 pb-5 flex flex-col gap-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            {([
              ['wrongReason', '왜 틀렸는지'],
              ['logic', '풀이 논리'],
              ['keyFunctions', '핵심 함수/문법'],
              ['freeNote', '자유 메모'],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>{label}</label>
                <textarea
                  value={memo[key]}
                  onChange={(e) => setMemo({ ...memo, [key]: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none border"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-h)' }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}

      <div className="flex gap-2 justify-end">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg text-sm cursor-pointer"
          style={{ background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          취소
        </button>
        <button
          onClick={() => solutionMutation.mutate()}
          disabled={solutionMutation.isPending || !form.code.trim() || form.problemId === 0}
          className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-60"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {solutionMutation.isPending ? '저장 중...' : isEdit ? '수정 완료' : '등록하기'}
        </button>
      </div>
    </div>
  )
}

function UrlMatchHint({ normalized }: { normalized: string | null }) {
  return (
    <p className="text-xs flex items-center gap-1.5" style={{ color: '#f59e0b' }}>
      <AlertTriangle size={11} />
      {normalized
        ? 'DB 에 등록되지 않은 문제입니다 — 아래에서 직접 선택해주세요.'
        : '프로그래머스 URL 형식이 아닙니다.'}
    </p>
  )
}
