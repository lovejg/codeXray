import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Star, Sparkles, ChevronDown, ChevronUp, BookOpen, Zap, Loader2, MessageSquare, Plus, ArrowRight, RefreshCw } from 'lucide-react'
import { problemsApi } from '../api/problems'
import { solutionsApi } from '../api/solutions'
import { aiApi, type AiTaskType } from '../api/ai'
import { ratingsApi } from '../api/ratings'
import { bookmarksApi } from '../api/bookmarks'
import { communityApi } from '../api/community'
import { POST_TYPE_LABEL } from '../types'
import CopyButton from '../components/common/CopyButton'
import PostContent from '../components/common/PostContent'
import UserLink from '../components/common/UserLink'
import LevelBadge from '../components/common/LevelBadge'
import SourceBadge from '../components/common/SourceBadge'
import TagBadge from '../components/common/TagBadge'
import TierBadge from '../components/common/TierBadge'
import CodeEditor from '../components/common/CodeEditor'
import { useAuthStore } from '../store/authStore'

const AI_TASKS: { key: AiTaskType; label: string; description: string; Icon: typeof BookOpen }[] = [
  {
    key: 'explain',
    label: '풀이 설명',
    description: '내 코드의 동작 원리와 접근 방식을 단계별로 풀어 설명합니다.',
    Icon: BookOpen,
  },
  {
    key: 'optimize',
    label: '최적화',
    description: '더 효율적인 알고리즘이나 개선 가능한 부분을 제안합니다.',
    Icon: Zap,
  },
]

export default function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [aiTask, setAiTask] = useState<AiTaskType>('explain')
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showMemo, setShowMemo] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [communityTab, setCommunityTab] = useState<'SOLUTION_SHARE' | 'QUESTION'>('SOLUTION_SHARE')

  const { data: problem, isLoading } = useQuery({
    queryKey: ['problem', id],
    queryFn: () => problemsApi.getOne(Number(id)),
  })

  const { data: solutions = [] } = useQuery({
    queryKey: ['solutions'],
    queryFn: () => solutionsApi.getAll(),
    enabled: !!user,
  })

  const mySolution = solutions.find((s) => s.problemId === Number(id))

  const { data: myFeedback, isSuccess: feedbackLoaded } = useQuery({
    queryKey: ['feedback', id],
    queryFn: () => ratingsApi.getMyFeedback(Number(id)),
    enabled: !!user && !!mySolution,
  })

  const starMutation = useMutation({
    mutationFn: () => solutionsApi.toggleStar(mySolution!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['solutions'] }),
  })

  const { data: relatedPosts = [] } = useQuery({
    queryKey: ['posts', 'problem', id, communityTab],
    queryFn: () =>
      communityApi.getPosts({
        type: communityTab,
        problemId: Number(id),
      }),
    enabled: !!id,
  })

  const { data: bookmarkedIds = [] } = useQuery<number[]>({
    queryKey: ['bookmark-ids'],
    queryFn: bookmarksApi.getIds,
    enabled: !!user,
  })
  const isBookmarked = bookmarkedIds.includes(Number(id))

  const bookmarkMutation = useMutation({
    mutationFn: () => bookmarksApi.toggle(Number(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookmark-ids'] })
      qc.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })

  const feedbackMutation = useMutation({
    mutationFn: (level: number) => ratingsApi.submitFeedback(Number(id), level),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback', id] })
      qc.invalidateQueries({ queryKey: ['problem', id] })
      qc.invalidateQueries({ queryKey: ['problems'] })
      setShowFeedbackModal(false)
    },
  })

  useEffect(() => {
    if (mySolution && feedbackLoaded && !myFeedback) {
      setShowFeedbackModal(true)
    }
  }, [mySolution, feedbackLoaded, myFeedback])

  const handleAiAnalyze = async (task?: AiTaskType) => {
    const selectedTask = task ?? aiTask
    if (!mySolution?.code) return
    setAiLoading(true)
    setAiResult('')
    try {
      const res = await aiApi.analyze({
        code: mySolution.code,
        task: selectedTask,
        language: mySolution.language,
        problemTitle: problem?.title,
      })
      setAiResult(res.result)
    } finally {
      setAiLoading(false)
    }
  }

  if (isLoading) return <div className="text-center py-20" style={{ color: 'var(--text)' }}>불러오는 중...</div>
  if (!problem) return <div className="text-center py-20" style={{ color: 'var(--text)' }}>문제를 찾을 수 없습니다.</div>

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto">
      {/* 문제 헤더 */}
      <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>{problem.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <TierBadge tier={problem.tier} size="md" />
              <SourceBadge source={problem.source} />
              <LevelBadge level={problem.level} />
              {problem.tags.map((t) => <TagBadge key={t.tag.id} name={t.tag.name} />)}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {user && (
              <button
                onClick={() => bookmarkMutation.mutate()}
                aria-label={isBookmarked ? '북마크 해제' : '북마크'}
                className="p-2 rounded-lg transition-colors cursor-pointer"
                style={{ background: isBookmarked ? '#451a03' : 'var(--bg-hover)', color: isBookmarked ? '#f59e0b' : 'var(--text)' }}
              >
                <Star size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>
            )}
            <a
              href={problem.link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <ExternalLink size={14} />
              문제 보기
            </a>
          </div>
        </div>
      </div>

      {/* 내 풀이 */}
      {mySolution ? (
        <div className="rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text-h)' }}>내 풀이</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}>
                {mySolution.language}
              </span>
              <CopyButton text={mySolution.code} size={13} />
              <button
                onClick={() => starMutation.mutate()}
                aria-label={mySolution.starred ? '즐겨찾기 해제' : '즐겨찾기'}
                className="p-1 rounded transition-colors cursor-pointer hover:bg-white/10"
                style={{ color: mySolution.starred ? '#f59e0b' : 'var(--text)' }}
              >
                <Star size={14} fill={mySolution.starred ? 'currentColor' : 'none'} />
              </button>
              <Link
                to={`/solutions/${mySolution.id}/edit`}
                className="text-xs px-2 py-0.5 rounded transition-colors hover:bg-white/10"
                style={{ color: 'var(--accent-light)' }}
              >
                수정
              </Link>
            </div>
          </div>
          <CodeEditor
            value={mySolution.code}
            language={mySolution.language}
            readOnly
            minHeight="auto"
          />

        </div>
      ) : user ? (
        <Link
          to={`/solutions/new?problemId=${id}`}
          className="rounded-xl border-2 border-dashed p-10 text-center transition-all hover:bg-white/5 flex flex-col items-center gap-2"
          style={{ borderColor: 'var(--accent-border)' }}
        >
          <span className="text-2xl">✍️</span>
          <span className="font-medium" style={{ color: 'var(--accent-light)' }}>풀이 등록하기</span>
          <span className="text-xs" style={{ color: 'var(--text)' }}>코드와 메모를 함께 기록해보세요</span>
        </Link>
      ) : (
        <div className="rounded-xl border p-8 text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <p className="text-sm mb-3" style={{ color: 'var(--text)' }}>풀이를 등록하려면 로그인이 필요합니다.</p>
          <Link to="/login" className="text-sm font-medium" style={{ color: 'var(--accent-light)' }}>로그인하기</Link>
        </div>
      )}

      {/* 메모 */}
      {mySolution?.memo && (
        <div className="rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <button
            className="w-full flex items-center justify-between px-5 py-4 cursor-pointer"
            onClick={() => setShowMemo(!showMemo)}
          >
            <h2 className="font-semibold" style={{ color: 'var(--text-h)' }}>메모</h2>
            {showMemo ? <ChevronUp size={16} style={{ color: 'var(--text)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text)' }} />}
          </button>
          {showMemo && (
            <div className="px-5 pb-5 flex flex-col gap-3 border-t" style={{ borderColor: 'var(--border)' }}>
              {mySolution.memo.wrongReason && <MemoSection label="왜 틀렸는지" content={mySolution.memo.wrongReason} />}
              {mySolution.memo.logic && <MemoSection label="풀이 논리" content={mySolution.memo.logic} />}
              {mySolution.memo.keyFunctions && <MemoSection label="핵심 함수/문법" content={mySolution.memo.keyFunctions} />}
              {mySolution.memo.freeNote && <MemoSection label="메모" content={mySolution.memo.freeNote} />}
            </div>
          )}
        </div>
      )}

      {/* AI 분석 요청 */}
      {mySolution && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div
            className="px-5 py-4 border-b flex items-start gap-3"
            style={{
              borderColor: 'var(--border)',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.06))',
            }}
          >
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
            >
              <Sparkles size={16} style={{ color: '#fff' }} />
            </div>
            <div className="flex flex-col gap-0.5">
              <h2 className="font-semibold" style={{ color: 'var(--text-h)' }}>AI 분석 요청</h2>
              <p className="text-xs" style={{ color: 'var(--text)' }}>
                Claude 가 내 풀이를 읽고 설명하거나 개선점을 제안합니다
              </p>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AI_TASKS.map(({ key, label, description, Icon }) => {
                const active = aiTask === key
                const loading = aiLoading && active
                const hasResult = active && !!aiResult && !aiLoading
                return (
                  <button
                    key={key}
                    onClick={() => { setAiTask(key); handleAiAnalyze(key) }}
                    disabled={aiLoading}
                    className="text-left p-4 rounded-lg border transition-all cursor-pointer disabled:cursor-not-allowed flex flex-col gap-1.5 hover:-translate-y-0.5"
                    style={{
                      background: hasResult
                        ? 'linear-gradient(135deg, rgba(59,130,246,0.10), rgba(139,92,246,0.10))'
                        : loading
                          ? 'rgba(59,130,246,0.06)'
                          : 'var(--bg)',
                      borderColor: hasResult ? 'var(--accent-light)' : loading ? 'var(--accent)' : 'var(--border)',
                      opacity: aiLoading && !active ? 0.5 : 1,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={15} style={{ color: 'var(--accent-light)' }} />
                      <span className="font-medium text-sm" style={{ color: 'var(--text-h)' }}>{label}</span>
                      {loading && <Loader2 size={13} className="animate-spin ml-auto" style={{ color: 'var(--accent-light)' }} />}
                      {hasResult && (
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                          완료
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{description}</p>
                  </button>
                )
              })}
            </div>

            {/* 결과는 로딩 중이거나 결과가 있을 때만 표시 */}
            {(aiLoading || aiResult) && (
              <div
                className="rounded-lg border overflow-hidden"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <div
                  className="px-4 py-2.5 border-b flex items-center justify-between"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-h)' }}>
                    <Sparkles size={12} style={{ color: 'var(--accent-light)' }} />
                    <span className="font-medium">
                      {AI_TASKS.find((t) => t.key === aiTask)?.label} 결과
                    </span>
                  </div>
                  {aiResult && !aiLoading && (
                    <button
                      onClick={() => handleAiAnalyze(aiTask)}
                      className="flex items-center gap-1 text-[11px] px-2 py-1 rounded cursor-pointer hover:bg-white/5"
                      style={{ color: 'var(--text)' }}
                      title="다시 요청"
                    >
                      <RefreshCw size={11} />
                      재요청
                    </button>
                  )}
                </div>
                <div className="p-4">
                  {aiLoading ? (
                    <div className="flex items-center gap-2 py-6 justify-center" style={{ color: 'var(--text)' }}>
                      <Loader2 size={15} className="animate-spin" />
                      <span className="text-sm">분석 중입니다...</span>
                    </div>
                  ) : (
                    <PostContent content={aiResult} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 관련 커뮤니티 글 */}
      <div className="rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="px-5 py-4 border-b flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-h)' }}>
            <MessageSquare size={16} style={{ color: 'var(--accent-light)' }} />
            관련 커뮤니티 글
          </h2>
          <div className="flex items-center gap-2">
            {(['SOLUTION_SHARE', 'QUESTION'] as const).map((t) => {
              const active = communityTab === t
              return (
                <button
                  key={t}
                  onClick={() => setCommunityTab(t)}
                  className="px-3 py-1 rounded-lg text-xs cursor-pointer border"
                  style={{
                    background: active ? 'var(--accent)' : 'var(--bg-hover)',
                    color: active ? '#fff' : 'var(--text)',
                    borderColor: active ? 'var(--accent)' : 'var(--border)',
                  }}
                >
                  {POST_TYPE_LABEL[t]}
                </button>
              )
            })}
          </div>
        </div>
        <div className="p-5 flex flex-col gap-2">
          {relatedPosts.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text)' }}>
              아직 {POST_TYPE_LABEL[communityTab]} 글이 없습니다.
            </p>
          ) : (
            relatedPosts.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                to={`/community/${p.id}`}
                className="rounded-lg border p-3 flex items-start gap-3 transition-colors hover:bg-white/5"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-h)' }}>{p.title}</p>
                  <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: 'var(--text)' }}>
                    <UserLink userId={p.user.id} nickname={p.user.nickname} />
                    <span>·</span>
                    <span>{new Date(p.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs shrink-0 pt-1" style={{ color: 'var(--text)' }}>
                  <MessageSquare size={12} />
                  {p._count?.comments ?? 0}
                </div>
              </Link>
            ))
          )}
          <div className="flex items-center justify-between pt-2">
            {relatedPosts.length > 5 ? (
              <Link
                to={`/community?problemId=${id}`}
                className="text-xs flex items-center gap-1 hover:underline"
                style={{ color: 'var(--accent-light)' }}
              >
                이 문제 글 모두 보기 <ArrowRight size={12} />
              </Link>
            ) : <span />}
            {user && (
              <Link
                to={`/community/new?problemId=${id}&type=${communityTab}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ml-auto"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                <Plus size={12} />
                {communityTab === 'SOLUTION_SHARE' ? '풀이 공유하기' : '질문하기'}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 난이도 피드백 모달 (풀이 등록 직후 강제) */}
      {showFeedbackModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          <div
            className="w-full max-w-md rounded-xl border p-6 flex flex-col gap-4"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold text-lg flex items-center gap-2" style={{ color: 'var(--text-h)' }}>
                <Sparkles size={18} style={{ color: 'var(--accent-light)' }} />
                체감 난이도를 알려주세요
              </h3>
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                풀이를 직접 경험하신 분의 의견이 가장 정확합니다. 다른 사용자에게도 큰 도움이 돼요.
              </p>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {[0, 1, 2, 3, 4, 5].map((lv) => (
                <button
                  key={lv}
                  onClick={() => feedbackMutation.mutate(lv)}
                  disabled={feedbackMutation.isPending}
                  className="py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
                  style={{ background: 'var(--bg-hover)', color: 'var(--text-h)' }}
                >
                  {lv}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text)' }}>
              <span>쉬움</span>
              <span>어려움</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MemoSection({ label, content }: { label: string; content: string }) {
  return (
    <div className="flex flex-col gap-1 pt-3">
      <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{label}</span>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-h)' }}>{content}</p>
    </div>
  )
}
