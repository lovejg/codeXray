import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, EyeOff, Eye, Flag } from 'lucide-react'
import { communityApi } from '../api/community'
import { useIsAdmin } from '../store/authStore'
import type {
  ReportStatus,
  PostReport,
} from '../types'
import {
  REPORT_STATUS_LABEL,
  REPORT_STATUS_COLOR,
  POST_TYPE_LABEL,
} from '../types'

const STATUSES: (ReportStatus | 'ALL')[] = ['OPEN', 'HANDLED', 'DISMISSED', 'ALL']

export default function AdminReportsPage() {
  const navigate = useNavigate()
  const isAdmin = useIsAdmin()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<ReportStatus | 'ALL'>('OPEN')

  useEffect(() => {
    if (!isAdmin) navigate('/')
  }, [isAdmin, navigate])

  const { data: reports = [], isLoading } = useQuery<PostReport[]>({
    queryKey: ['admin-reports', filter],
    queryFn: () => communityApi.adminListReports(filter === 'ALL' ? undefined : filter),
    enabled: isAdmin,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: number; status: ReportStatus; adminNote?: string }) =>
      communityApi.adminUpdateReport(id, { status, adminNote }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] })
    },
  })

  const hideMutation = useMutation({
    mutationFn: ({ postId, hidden }: { postId: number; hidden: boolean }) =>
      communityApi.adminHidePost(postId, hidden),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reports'] }),
  })

  if (!isAdmin) return null

  // 한 게시글에 대한 여러 신고를 그룹핑
  const byPost = new Map<number, PostReport[]>()
  for (const r of reports) {
    const arr = byPost.get(r.post.id) ?? []
    arr.push(r)
    byPost.set(r.post.id, arr)
  }
  const postGroups = Array.from(byPost.entries()).sort((a, b) => b[1].length - a[1].length)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} style={{ color: 'var(--accent-light)' }} />
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>신고 관리</h1>
        </div>
        <p className="text-xs" style={{ color: 'var(--text)' }}>
          게시글을 숨기면 해당 게시글의 미처리 신고가 자동으로 "처리 완료" 로 바뀝니다. 신고만 처리하고 글은 그대로 두려면 우측 "처리 완료" / "기각" 을 사용하세요.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const active = filter === s
          const label = s === 'ALL' ? '전체' : REPORT_STATUS_LABEL[s]
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-lg text-sm cursor-pointer border"
              style={{
                background: active ? 'var(--accent)' : 'var(--bg-card)',
                color: active ? '#fff' : 'var(--text)',
                borderColor: active ? 'var(--accent)' : 'var(--border)',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="text-center py-20" style={{ color: 'var(--text)' }}>불러오는 중...</div>
      ) : postGroups.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--text)' }}>해당 상태의 신고가 없습니다.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {postGroups.map(([postId, group]) => {
            const post = group[0].post
            return (
              <div
                key={postId}
                className="rounded-xl border p-5 flex flex-col gap-3"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Flag size={14} style={{ color: '#ef4444' }} />
                      <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: 'var(--bg-hover)', color: 'var(--text-h)' }}>
                        {POST_TYPE_LABEL[post.type]}
                      </span>
                      <span className="text-xs font-medium" style={{ color: '#ef4444' }}>
                        신고 {group.length}건
                      </span>
                      {post.hidden && (
                        <span className="text-[11px] flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: '#2a1212', color: '#fca5a5' }}>
                          <EyeOff size={10} /> 숨김
                        </span>
                      )}
                    </div>
                    <Link
                      to={post.type === 'QUESTION' || post.type === 'SOLUTION_SHARE' ? `/community/${post.id}` : `/suggestions/${post.id}`}
                      className="text-sm font-semibold hover:underline"
                      style={{ color: 'var(--text-h)' }}
                    >
                      {post.title}
                    </Link>
                    <span className="text-xs" style={{ color: 'var(--text)' }}>
                      작성자 {post.user.nickname}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => hideMutation.mutate({ postId: post.id, hidden: !post.hidden })}
                      disabled={hideMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer border disabled:opacity-60"
                      style={{
                        background: post.hidden ? 'var(--bg-hover)' : '#2a1212',
                        color: post.hidden ? 'var(--text-h)' : '#fca5a5',
                        borderColor: post.hidden ? 'var(--border)' : '#7f1d1d',
                      }}
                    >
                      {post.hidden ? <><Eye size={12} /> 숨김 해제</> : <><EyeOff size={12} /> 게시글 숨김</>}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                  {group.map((r) => {
                    const c = REPORT_STATUS_COLOR[r.status]
                    return (
                      <div key={r.id} className="flex items-start justify-between gap-3 text-xs">
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium" style={{ color: 'var(--text-h)' }}>{r.user.nickname}</span>
                            <span style={{ color: 'var(--text)' }}>{new Date(r.createdAt).toLocaleDateString('ko-KR')}</span>
                            <span className="px-2 py-0.5 rounded font-medium" style={{ background: c.bg, color: c.text }}>
                              {REPORT_STATUS_LABEL[r.status]}
                            </span>
                          </div>
                          <p style={{ color: 'var(--text-h)' }}>{r.reason}</p>
                          {r.adminNote && (
                            <p className="mt-0.5" style={{ color: 'var(--text)' }}>관리자 메모: {r.adminNote}</p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {r.status !== 'HANDLED' && (
                            <button
                              onClick={() => statusMutation.mutate({ id: r.id, status: 'HANDLED' })}
                              className="px-2 py-1 rounded text-[11px] cursor-pointer"
                              style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}
                            >
                              처리 완료
                            </button>
                          )}
                          {r.status !== 'DISMISSED' && (
                            <button
                              onClick={() => statusMutation.mutate({ id: r.id, status: 'DISMISSED' })}
                              className="px-2 py-1 rounded text-[11px] cursor-pointer"
                              style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
                            >
                              기각
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
