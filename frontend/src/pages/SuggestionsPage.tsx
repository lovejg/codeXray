import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { MessageSquare, Plus, Lock } from 'lucide-react'
import { communityApi } from '../api/community'
import type { PostType, SuggestionStatus } from '../types'
import {
  POST_TYPE_LABEL,
  POST_TYPE_STYLE,
  SUGGESTION_POST_TYPES,
  STATUS_LABEL,
  STATUS_COLOR,
} from '../types'
import { useAuthStore } from '../store/authStore'
import PostTypeBadge from '../components/common/PostTypeBadge'
import UserLink from '../components/common/UserLink'

const TYPES = SUGGESTION_POST_TYPES.map((t) => [t, POST_TYPE_LABEL[t]] as const)
const STATUSES: SuggestionStatus[] = ['IN_PROGRESS', 'RESOLVED']

export default function SuggestionsPage() {
  const { user } = useAuthStore()
  const [type, setType] = useState<PostType | ''>('')
  const [status, setStatus] = useState<SuggestionStatus | ''>('')

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts', 'suggestions', type, status],
    queryFn: () =>
      communityApi.getPosts({
        types: type ? [type] : SUGGESTION_POST_TYPES,
        ...(status ? { status } : {}),
      }),
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>건의사항</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text)' }}>
            레벨/태그 의견, 버그 제보, 기능 요청을 남길 수 있습니다.
          </p>
        </div>
        {user && (
          <Link
            to="/suggestions/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Plus size={14} />
            건의 남기기
          </Link>
        )}
      </div>

      {/* 타입 필터 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setType('')}
          className="px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer border"
          style={{
            background: type === '' ? 'var(--accent)' : 'var(--bg-card)',
            color: type === '' ? '#fff' : 'var(--text)',
            borderColor: type === '' ? 'var(--accent)' : 'var(--border)',
          }}
        >
          전체
        </button>
        {TYPES.map(([val, label]) => {
          const active = type === val
          const c = POST_TYPE_STYLE[val]
          return (
            <button
              key={val}
              onClick={() => setType(val)}
              className="px-3 py-1.5 rounded-lg text-sm cursor-pointer border"
              style={{
                background: active ? c.bg : 'var(--bg-card)',
                color: active ? c.text : 'var(--text)',
                borderColor: active ? c.text : 'var(--border)',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* 상태 필터 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--text)' }}>상태</span>
        <button
          onClick={() => setStatus('')}
          className="px-2.5 py-1 rounded-lg text-xs cursor-pointer border"
          style={{
            background: status === '' ? 'var(--accent)' : 'var(--bg-card)',
            color: status === '' ? '#fff' : 'var(--text)',
            borderColor: status === '' ? 'var(--accent)' : 'var(--border)',
          }}
        >
          전체
        </button>
        {STATUSES.map((s) => {
          const active = status === s
          const c = STATUS_COLOR[s]
          return (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className="px-2.5 py-1 rounded-lg text-xs cursor-pointer border"
              style={{
                background: active ? c.bg : 'var(--bg-card)',
                color: active ? c.text : 'var(--text)',
                borderColor: active ? c.text : 'var(--border)',
              }}
            >
              {STATUS_LABEL[s]}
            </button>
          )
        })}
      </div>

      {/* 게시글 목록 */}
      {isLoading ? (
        <div className="text-center py-20" style={{ color: 'var(--text)' }}>불러오는 중...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--text)' }}>건의사항이 없습니다.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {posts.map((p: any) => {
            const sc = p.status ? STATUS_COLOR[p.status as SuggestionStatus] : null
            return (
              <Link
                key={p.id}
                to={`/suggestions/${p.id}`}
                className="rounded-xl border p-4 flex items-start gap-4 transition-colors hover:bg-white/5"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <PostTypeBadge type={p.type as PostType} />
                    {sc && (
                      <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: sc.bg, color: sc.text }}>
                        {STATUS_LABEL[p.status as SuggestionStatus]}
                      </span>
                    )}
                    {p.isPrivate && (
                      <span className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}>
                        <Lock size={10} /> 비공개
                      </span>
                    )}
                    {p.problem && (
                      <span className="text-xs" style={{ color: 'var(--text)' }}>{p.problem.title}</span>
                    )}
                  </div>
                  <p className="font-medium" style={{ color: 'var(--text-h)' }}>{p.title}</p>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text)' }}>
                    <UserLink userId={p.user.id} nickname={p.user.nickname} />
                    <span>{new Date(p.createdAt).toLocaleDateString('ko-KR')}</span>
                    {p.adminReply && <span style={{ color: '#10b981' }}>✓ 관리자 답변</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs shrink-0" style={{ color: 'var(--text)' }}>
                  <MessageSquare size={13} />
                  {p._count?.comments ?? 0}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
