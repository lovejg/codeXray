import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Star, ExternalLink } from 'lucide-react'
import { bookmarksApi } from '../api/bookmarks'
import LevelBadge from '../components/common/LevelBadge'
import SourceBadge from '../components/common/SourceBadge'
import TagBadge from '../components/common/TagBadge'
import TierBadge from '../components/common/TierBadge'

export default function MyProblemsPage() {
  const qc = useQueryClient()

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: bookmarksApi.getAll,
  })

  const removeMutation = useMutation({
    mutationFn: (problemId: number) => bookmarksApi.toggle(problemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookmarks'] })
      qc.invalidateQueries({ queryKey: ['bookmark-ids'] })
    },
  })

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>나의 문제</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text)' }}>
          별표 표시한 문제 {bookmarks.length}개 · 다시 풀고 싶은 문제들을 모아보세요
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-20" style={{ color: 'var(--text)' }}>불러오는 중...</div>
      ) : bookmarks.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-16 text-center flex flex-col items-center gap-3"
          style={{ borderColor: 'var(--border)' }}>
          <Star size={32} style={{ color: 'var(--text)' }} />
          <p className="font-medium" style={{ color: 'var(--text-h)' }}>북마크한 문제가 없습니다</p>
          <p className="text-sm" style={{ color: 'var(--text)' }}>문제 목록에서 별표를 눌러 저장하세요</p>
          <Link
            to="/problems"
            className="mt-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            문제 목록으로
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                <th className="w-8 px-3 py-3" />
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>문제명</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell" style={{ color: 'var(--text)' }}>출처</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell" style={{ color: 'var(--text)' }}>알고리즘</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>티어</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell" style={{ color: 'var(--text)' }}>공식 Lv</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>링크</th>
              </tr>
            </thead>
            <tbody>
              {bookmarks.map((b) => (
                <tr
                  key={b.problemId}
                  className="border-t transition-colors hover:bg-white/5"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <td className="px-3 py-3">
                    <button
                      onClick={() => removeMutation.mutate(b.problemId)}
                      className="p-1 rounded transition-colors hover:bg-white/10 cursor-pointer"
                      style={{ color: '#f59e0b' }}
                      title="북마크 해제"
                    >
                      <Star size={14} fill="currentColor" />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/problems/${b.problemId}`} className="font-medium hover:underline" style={{ color: 'var(--text-h)' }}>
                      {b.problem.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <SourceBadge source={b.problem.source} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {b.problem.tags.slice(0, 3).map((t) => (
                        <TagBadge key={t.tag.id} name={t.tag.name} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <TierBadge tier={b.problem.tier} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <LevelBadge level={b.problem.level} />
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={b.problem.link}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:brightness-110"
                      style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }}
                    >
                      <ExternalLink size={13} />
                      원문
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
