import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Calendar, MessageSquare, ThumbsUp, ArrowLeft } from 'lucide-react'
import { userStatsApi, communityApi } from '../api/community'
import type { PostType, PublicUserStats } from '../types'
import { COMMUNITY_POST_TYPES } from '../types'
import {
  TIER_FAMILIES,
  FAMILY_COLORS,
  familyLabel,
  type TierFamily,
} from '../components/common/TierBadge'
import PostTypeBadge from '../components/common/PostTypeBadge'

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>()
  const userId = Number(id)

  const { data: stats, isLoading, error } = useQuery<PublicUserStats>({
    queryKey: ['user-stats', userId],
    queryFn: () => userStatsApi.getPublicStats(userId),
    enabled: userId > 0,
  })

  const { data: posts = [] } = useQuery({
    queryKey: ['posts', 'by-author', userId],
    queryFn: () =>
      communityApi.getPosts({ authorId: userId, types: COMMUNITY_POST_TYPES }),
    enabled: userId > 0 && !!stats,
  })

  const tagCounts = useMemo(() => {
    if (!stats) return [] as Array<{ name: string; count: number }>
    return Object.entries(stats.algorithmTagCounts ?? {})
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [stats])

  const maxTagCount = tagCounts[0]?.count ?? 1
  const unrated = stats ? stats.solveCount - Object.values(stats.tierFamilyCounts ?? {}).reduce((a, b) => a + b, 0) : 0

  if (userId <= 0) {
    return (
      <div className="text-center py-20" style={{ color: 'var(--text)' }}>
        탈퇴한 사용자의 프로필은 표시할 수 없습니다.
      </div>
    )
  }

  if (isLoading) return <div className="text-center py-20" style={{ color: 'var(--text)' }}>불러오는 중...</div>
  if (error || !stats) {
    return <div className="text-center py-20" style={{ color: 'var(--text)' }}>유저를 찾을 수 없습니다.</div>
  }

  const mainColor = stats.mainTierFamily ? FAMILY_COLORS[stats.mainTierFamily as TierFamily] : null

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      <Link to="/community" className="flex items-center gap-1.5 text-sm w-fit cursor-pointer" style={{ color: 'var(--text)' }}>
        <ArrowLeft size={14} /> 커뮤니티로
      </Link>

      {/* 프로필 카드 */}
      <div className="rounded-xl border p-6 flex flex-col gap-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>{stats.nickname}</h1>
          {mainColor && stats.mainTierFamily && (
            <span
              className="inline-flex items-center rounded font-semibold px-2 py-0.5 text-xs"
              style={{ background: mainColor.bg, color: mainColor.text, border: `1px solid ${mainColor.border}` }}
            >
              주 티어 {familyLabel(stats.mainTierFamily as TierFamily)}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--text)' }}>
          <span className="flex items-center gap-1">
            <BookOpen size={12} />
            풀이 <span className="font-semibold" style={{ color: 'var(--text-h)' }}>{stats.solveCount}</span>개
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            가입일 {new Date(stats.createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>
      </div>

      {/* 티어 분포 */}
      {stats.solveCount > 0 && (
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>티어별 풀이 수</h2>
            {unrated > 0 && (
              <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.7 }}>
                Unrated {unrated}개 제외
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {TIER_FAMILIES.map((family) => {
              const count = stats.tierFamilyCounts?.[family] ?? 0
              const tieredTotal = Object.values(stats.tierFamilyCounts ?? {}).reduce((a, b) => a + b, 0)
              const c = FAMILY_COLORS[family]
              const pct = tieredTotal ? (count / tieredTotal) * 100 : 0
              return (
                <div key={family} className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center justify-center rounded font-semibold text-xs w-20 py-0.5"
                    style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                  >
                    {familyLabel(family)}
                  </span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: c.text }}
                    />
                  </div>
                  <span className="text-xs w-10 text-right tabular-nums" style={{ color: 'var(--text)' }}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 알고리즘 분포 */}
      {tagCounts.length > 0 && (
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>알고리즘별 풀이 수</h2>
            <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.7 }}>{tagCounts.length}개 분야</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {tagCounts.map(({ name, count }) => {
              const pct = (count / maxTagCount) * 100
              const ratio = stats.solveCount ? Math.round((count / stats.solveCount) * 100) : 0
              return (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xs w-24 truncate" style={{ color: 'var(--text-h)' }}>#{name}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: 'var(--accent-light)' }}
                    />
                  </div>
                  <span className="text-xs w-8 text-right tabular-nums" style={{ color: 'var(--text-h)' }}>{count}</span>
                  <span className="text-[10px] w-10 text-right tabular-nums" style={{ color: 'var(--text)', opacity: 0.6 }}>{ratio}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 작성한 커뮤니티 글 */}
      <div className="rounded-xl border p-5 flex flex-col gap-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>커뮤니티 글</h2>
        {posts.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--text)' }}>작성한 글이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {posts.map((p: any) => (
              <Link
                key={p.id}
                to={`/community/${p.id}`}
                className="rounded-lg border p-3 flex items-start gap-3 transition-colors hover:bg-white/5"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <PostTypeBadge type={p.type as PostType} size="xs" />
                    {p.problem && (
                      <span className="text-xs truncate" style={{ color: 'var(--text)' }}>{p.problem.title}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-h)' }}>{p.title}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text)', opacity: 0.7 }}>
                    {new Date(p.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs shrink-0" style={{ color: 'var(--text)' }}>
                  <span className="flex items-center gap-1">
                    <ThumbsUp size={11} />
                    <span className="tabular-nums">{p.score ?? 0}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={11} />
                    <span className="tabular-nums">{p._count?.comments ?? 0}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
