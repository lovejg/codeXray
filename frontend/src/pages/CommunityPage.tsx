import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { MessageSquare, Plus, X, ThumbsUp } from 'lucide-react'
import { communityApi } from '../api/community'
import { problemsApi } from '../api/problems'
import type { PostType } from '../types'
import { POST_TYPE_LABEL, COMMUNITY_POST_TYPES } from '../types'
import { useAuthStore } from '../store/authStore'
import PostTypeBadge from '../components/common/PostTypeBadge'
import UserLink from '../components/common/UserLink'

const COMMUNITY_TYPES = COMMUNITY_POST_TYPES.map((t) => [t, POST_TYPE_LABEL[t]] as const)

export default function CommunityPage() {
  const { user } = useAuthStore()
  const [params, setParams] = useSearchParams()
  const problemId = params.get('problemId')
  const [type, setType] = useState<PostType | ''>('')
  const [sort, setSort] = useState<'recent' | 'votes'>('recent')

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts', 'community', type, problemId, sort],
    queryFn: () =>
      communityApi.getPosts({
        ...(type ? { type } : { types: COMMUNITY_POST_TYPES }),
        ...(problemId ? { problemId: Number(problemId) } : {}),
        sort,
      }),
  })

  const { data: focusedProblem } = useQuery({
    queryKey: ['problem', problemId],
    queryFn: () => problemsApi.getOne(Number(problemId)),
    enabled: !!problemId,
  })

  const clearProblem = () => {
    const next = new URLSearchParams(params)
    next.delete('problemId')
    setParams(next, { replace: true })
  }

  const writeHref = problemId
    ? `/community/new?problemId=${problemId}`
    : '/community/new'

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>커뮤니티</h1>
        {user && (
          <Link
            to={writeHref}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Plus size={14} />
            글쓰기
          </Link>
        )}
      </div>

      {/* 문제 필터 chip */}
      {problemId && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border w-fit"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--accent-border)' }}
        >
          <span className="text-xs" style={{ color: 'var(--text)' }}>관련 문제:</span>
          <span className="text-sm font-medium" style={{ color: 'var(--accent-light)' }}>
            {focusedProblem?.title ?? '문제'}
          </span>
          <button
            onClick={clearProblem}
            aria-label="필터 해제"
            className="p-1 rounded hover:bg-white/10 cursor-pointer"
            style={{ color: 'var(--text)' }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* 타입 + 정렬 필터 */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setType('')}
            className="px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer"
            style={{ background: type === '' ? 'var(--accent)' : 'var(--bg-card)', color: type === '' ? '#fff' : 'var(--text)', border: '1px solid var(--border)' }}
          >
            전체
          </button>
          {COMMUNITY_TYPES.map(([val, label]) => (
            <button
              key={val}
              onClick={() => setType(val)}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer"
              style={{ background: type === val ? 'var(--accent)' : 'var(--bg-card)', color: type === val ? '#fff' : 'var(--text)', border: '1px solid var(--border)' }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text)' }}>
          <button
            onClick={() => setSort('recent')}
            className="px-2.5 py-1 rounded cursor-pointer"
            style={{ background: sort === 'recent' ? 'var(--bg-hover)' : 'transparent', color: sort === 'recent' ? 'var(--text-h)' : 'var(--text)' }}
          >
            최신순
          </button>
          <span style={{ opacity: 0.4 }}>·</span>
          <button
            onClick={() => setSort('votes')}
            className="px-2.5 py-1 rounded cursor-pointer"
            style={{ background: sort === 'votes' ? 'var(--bg-hover)' : 'transparent', color: sort === 'votes' ? 'var(--text-h)' : 'var(--text)' }}
          >
            추천순
          </button>
        </div>
      </div>

      {/* 게시글 목록 */}
      {isLoading ? (
        <div className="text-center py-20" style={{ color: 'var(--text)' }}>불러오는 중...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--text)' }}>
          {problemId ? '이 문제에 대한 글이 아직 없습니다.' : '게시글이 없습니다.'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {posts.map((p: any) => {
            return (
              <Link
                key={p.id}
                to={`/community/${p.id}`}
                className="rounded-xl border p-4 flex items-start gap-4 transition-colors hover:bg-white/5"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <PostTypeBadge type={p.type as PostType} />
                    {p.problem && (
                      <span className="text-xs" style={{ color: 'var(--text)' }}>{p.problem.title}</span>
                    )}
                  </div>
                  <p className="font-medium" style={{ color: 'var(--text-h)' }}>{p.title}</p>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text)' }}>
                    <UserLink userId={p.user.id} nickname={p.user.nickname} />
                    <span>{new Date(p.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs shrink-0" style={{ color: 'var(--text)' }}>
                  <span className="flex items-center gap-1" title="추천 - 비추천">
                    <ThumbsUp size={12} />
                    <span className="tabular-nums" style={{ color: (p.score ?? 0) > 0 ? '#10b981' : (p.score ?? 0) < 0 ? '#ef4444' : undefined }}>
                      {p.score ?? 0}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={12} />
                    {p._count?.comments ?? 0}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
