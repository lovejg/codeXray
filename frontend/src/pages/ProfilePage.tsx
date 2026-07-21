import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Bookmark, LogOut, ExternalLink, KeyRound, Trash2, Settings } from 'lucide-react'
import { authApi } from '../api/auth'
import { solutionsApi } from '../api/solutions'
import { bookmarksApi } from '../api/bookmarks'
import { useAuthStore } from '../store/authStore'
import LevelBadge from '../components/common/LevelBadge'
import { TIER_FAMILIES, FAMILY_COLORS, familyLabel } from '../lib/tier'
import ChangePasswordModal from '../components/common/ChangePasswordModal'
import DeleteAccountModal from '../components/common/DeleteAccountModal'

export default function ProfilePage() {
  const { user, token, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (!token) navigate('/login')
  }, [token, navigate])

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: authApi.me,
    enabled: !!token,
  })

  const { data: solutions = [] } = useQuery({
    queryKey: ['solutions'],
    queryFn: () => solutionsApi.getAll(),
    enabled: !!token,
  })

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: bookmarksApi.getAll,
    enabled: !!token,
  })

  const starred = solutions.filter((s) => s.starred)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  const tierCounts = TIER_FAMILIES.map((family) => ({
    family,
    count: solutions.filter((s) => typeof s.problem.tier === 'string' && s.problem.tier.startsWith(family + '_')).length,
  }))
  const unrated = solutions.filter((s) => !s.problem.tier).length
  const tieredTotal = solutions.length - unrated

  // 알고리즘 태그별 풀이 수 (내림차순)
  const tagCountsMap = new Map<string, number>()
  for (const s of solutions) {
    for (const t of s.problem.tags ?? []) {
      const name = t.tag?.name
      if (!name) continue
      tagCountsMap.set(name, (tagCountsMap.get(name) ?? 0) + 1)
    }
  }
  const tagCounts = Array.from(tagCountsMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
  const maxTagCount = tagCounts[0]?.count ?? 1

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      {/* 프로필 카드 */}
      <div className="rounded-xl border p-6 flex items-start justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>{profile?.nickname ?? user.nickname}</h1>
          <p className="text-sm" style={{ color: 'var(--text)' }}>{profile?.email ?? user.email}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text)' }}>
            가입일 {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ko-KR') : ''}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors hover:bg-white/5"
          style={{ color: 'var(--text)' }}
        >
          <LogOut size={14} />
          로그아웃
        </button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<BookOpen size={18} style={{ color: 'var(--accent-light)' }} />} label="전체 풀이" value={solutions.length} />
        <StatCard
          icon={<Bookmark size={18} style={{ color: '#f59e0b' }} fill="#f59e0b" />}
          label="북마크한 문제"
          value={bookmarks.length}
          to="/my-problems"
        />
      </div>

      {/* 티어별 분포 */}
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
          {tierCounts.map(({ family, count }) => {
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
                <span className="text-xs w-10 text-right tabular-nums" style={{ color: 'var(--text)' }}>
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 알고리즘 태그별 분포 */}
      {tagCounts.length > 0 && (
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>알고리즘별 풀이 수</h2>
            <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.7 }}>
              {tagCounts.length}개 분야
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {tagCounts.map(({ name, count }) => {
              const pct = (count / maxTagCount) * 100
              const ratio = solutions.length ? Math.round((count / solutions.length) * 100) : 0
              return (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xs w-24 truncate" style={{ color: 'var(--text-h)' }}>#{name}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: 'var(--accent-light)' }}
                    />
                  </div>
                  <span className="text-xs w-8 text-right tabular-nums" style={{ color: 'var(--text-h)' }}>
                    {count}
                  </span>
                  <span className="text-[10px] w-10 text-right tabular-nums" style={{ color: 'var(--text)', opacity: 0.6 }}>
                    {ratio}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 별표 문제 목록 */}
      {starred.length > 0 && (
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h2 className="font-semibold mb-4 text-sm" style={{ color: 'var(--text-h)' }}>다시 풀어야 할 문제 ⭐</h2>
          <div className="flex flex-col gap-2">
            {starred.map((s) => (
              <Link
                key={s.id}
                to={`/problems/${s.problemId}`}
                className="flex items-center justify-between px-3 py-2 rounded-lg transition-colors hover:bg-white/5"
                style={{ color: 'var(--text-h)' }}
              >
                <span className="text-sm">{s.problem.title}</span>
                <div className="flex items-center gap-2">
                  <LevelBadge level={s.problem.level} />
                  <ExternalLink size={13} style={{ color: 'var(--text)' }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 계정 관리 */}
      <div className="rounded-xl border p-5 flex flex-col gap-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-h)' }}>
          <Settings size={14} />
          계정 관리
        </h2>

        {profile?.provider === 'LOCAL' ? (
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer hover:bg-white/5"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-h)' }}
          >
            <span className="flex items-center gap-2 text-sm">
              <KeyRound size={14} style={{ color: 'var(--accent-light)' }} />
              비밀번호 변경
            </span>
            <span className="text-xs" style={{ color: 'var(--text)' }}>›</span>
          </button>
        ) : (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-xs"
            style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
          >
            <KeyRound size={13} />
            <span>{profile?.provider} 계정은 해당 서비스에서 비밀번호를 관리합니다.</span>
          </div>
        )}

        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-colors border"
          style={{ background: 'rgba(239, 68, 68, 0.06)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Trash2 size={14} />
            회원 탈퇴
          </span>
          <span className="text-xs">›</span>
        </button>
      </div>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
      {showDeleteModal && profile && (
        <DeleteAccountModal
          provider={profile.provider}
          nickname={profile.nickname}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  to,
}: {
  icon: React.ReactNode
  label: string
  value: number
  to?: string
}) {
  const inner = (
    <div
      className="rounded-xl border p-4 flex items-center gap-3 h-full transition-colors"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      {icon}
      <div>
        <p className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>{value}</p>
        <p className="text-xs" style={{ color: 'var(--text)' }}>{label}</p>
      </div>
    </div>
  )
  return to ? (
    <Link to={to} className="block hover:brightness-110">
      {inner}
    </Link>
  ) : (
    inner
  )
}
