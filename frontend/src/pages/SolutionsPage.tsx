import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Star, Plus, Trash2 } from 'lucide-react'
import { solutionsApi } from '../api/solutions'
import LevelBadge from '../components/common/LevelBadge'
import SourceBadge from '../components/common/SourceBadge'
import TagBadge from '../components/common/TagBadge'
import { useAuthStore } from '../store/authStore'

export default function SolutionsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [starredOnly, setStarredOnly] = useState(false)

  const { data: solutions = [], isLoading } = useQuery({
    queryKey: ['solutions', starredOnly],
    queryFn: () => solutionsApi.getAll(starredOnly ? true : undefined),
    enabled: !!user,
  })

  const starMutation = useMutation({
    mutationFn: (id: number) => solutionsApi.toggleStar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['solutions'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => solutionsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['solutions'] }),
  })

  if (!user) return (
    <div className="text-center py-20" style={{ color: 'var(--text)' }}>
      <p>로그인이 필요합니다.</p>
      <Link to="/login" className="mt-3 inline-block text-sm" style={{ color: 'var(--accent-light)' }}>로그인하기</Link>
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>내 풀이</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text)' }}>{solutions.length}개의 풀이</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStarredOnly(!starredOnly)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
            style={{ background: starredOnly ? '#451a03' : 'var(--bg-card)', color: starredOnly ? '#f59e0b' : 'var(--text)', border: '1px solid var(--border)' }}
          >
            <Star size={14} fill={starredOnly ? 'currentColor' : 'none'} />
            별표만 보기
          </button>
          <Link
            to="/solutions/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Plus size={14} />
            풀이 추가
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20" style={{ color: 'var(--text)' }}>불러오는 중...</div>
      ) : solutions.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--text)' }}>
          {starredOnly ? '별표 표시한 풀이가 없습니다.' : '등록된 풀이가 없습니다.'}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {solutions.map((s: any) => (
            <div key={s.id} className="rounded-xl border p-4 flex items-start gap-4 transition-colors hover:bg-white/5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex-1 flex flex-col gap-2">
                <Link to={`/problems/${s.problemId}`} className="font-medium hover:underline" style={{ color: 'var(--text-h)' }}>
                  {s.problem.title}
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <SourceBadge source={s.problem.source} />
                  <LevelBadge level={s.problem.level} />
                  {s.problem.tags.slice(0, 3).map((t: any) => (
                    <TagBadge key={t.tag.id} name={t.tag.name} />
                  ))}
                </div>
                {s.memo?.freeNote && (
                  <p className="text-xs line-clamp-1" style={{ color: 'var(--text)' }}>{s.memo.freeNote}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => starMutation.mutate(s.id)}
                  className="p-2 rounded-lg transition-colors cursor-pointer"
                  style={{ color: s.starred ? '#f59e0b' : 'var(--text)' }}
                >
                  <Star size={15} fill={s.starred ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => { if (confirm('풀이를 삭제할까요?')) deleteMutation.mutate(s.id) }}
                  className="p-2 rounded-lg transition-colors cursor-pointer"
                  style={{ color: 'var(--text)' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
