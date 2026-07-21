import { useQuery } from '@tanstack/react-query'
import { BookOpen } from 'lucide-react'
import { userStatsApi } from '../../api/community'
import { FAMILY_COLORS, familyLabel, type TierFamily } from '../../lib/tier'
import type { PublicUserStats } from '../../types'

interface Props {
  userId: number
}

export default function AuthorStats({ userId }: Props) {
  // userId === 0 은 탈퇴한 사용자의 sentinel — 통계 조회 스킵
  const enabled = userId > 0

  const { data, isLoading } = useQuery<PublicUserStats>({
    queryKey: ['user-stats', userId],
    queryFn: () => userStatsApi.getPublicStats(userId),
    enabled,
  })

  if (!enabled) return null
  if (isLoading || !data) return null

  const family = data.mainTierFamily
  const color = family ? FAMILY_COLORS[family as TierFamily] : null

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs"
      style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
    >
      <span className="flex items-center gap-1">
        <BookOpen size={12} />
        풀이 <span className="font-semibold" style={{ color: 'var(--text-h)' }}>{data.solveCount}</span>개
      </span>
      {family && color ? (
        <span className="flex items-center gap-1.5">
          <span>주 티어</span>
          <span
            className="inline-flex items-center rounded font-semibold px-1.5 py-0.5 text-[11px]"
            style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}` }}
          >
            {familyLabel(family as TierFamily)}
          </span>
        </span>
      ) : (
        <span style={{ opacity: 0.7 }}>주 티어 미정</span>
      )}
    </div>
  )
}
