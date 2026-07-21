import { useState, useEffect, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, ExternalLink, Star, ChevronDown, ChevronLeft, ChevronRight, Sparkles, ArrowRight, PenLine, Check } from 'lucide-react'
import { problemsApi } from '../api/problems'
import { tagsApi } from '../api/tags'
import { bookmarksApi } from '../api/bookmarks'
import { solutionsApi } from '../api/solutions'
import LevelBadge from '../components/common/LevelBadge'
import SourceBadge from '../components/common/SourceBadge'
import TagBadge from '../components/common/TagBadge'
import TierBadge from '../components/common/TierBadge'
import { TIER_ORDER, tierLabel } from '../lib/tier'
import TierRangeSlider from '../components/common/TierRangeSlider'
import { useAuthStore } from '../store/authStore'
import type { ProblemSource } from '../types'
import { SOURCE_LABEL } from '../types'

const SOURCES = Object.entries(SOURCE_LABEL) as [ProblemSource, string][]
const TIER_MAX = TIER_ORDER.length - 1

export default function ProblemsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [source, setSource] = useState<ProblemSource | ''>('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])
  const [tierRange, setTierRange] = useState<[number, number]>([0, TIER_MAX])
  const [tagId, setTagId] = useState<number | ''>('')

  const [tierMin, tierMax] = tierRange
  const tierActive = tierMin !== 0 || tierMax !== TIER_MAX
  const [tierOpen, setTierOpen] = useState(false)
  const tierRef = useRef<HTMLDivElement>(null)

  const PAGE_SIZE = 50
  const [page, setPage] = useState(1)

  // 필터가 바뀌면 첫 페이지로 리셋 (debounce된 검색어에 반응해야 하므로 effect 사용)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [debouncedSearch, source, tierMin, tierMax, tagId])

  useEffect(() => {
    if (!tierOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (tierRef.current && !tierRef.current.contains(e.target as Node)) {
        setTierOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [tierOpen])

  const tierButtonLabel = tierActive
    ? `${tierLabel(TIER_ORDER[tierMin])} ~ ${tierLabel(TIER_ORDER[tierMax])}`
    : '전체 티어'

  const { data, isLoading } = useQuery({
    queryKey: ['problems', debouncedSearch, source, tierMin, tierMax, tagId, page],
    queryFn: () => problemsApi.getAll({
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(source && { source }),
      ...(tierActive && { tierMin, tierMax }),
      ...(tagId !== '' && { tagId: Number(tagId) }),
      page,
      pageSize: PAGE_SIZE,
    }),
    placeholderData: keepPreviousData,
  })
  const problems = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: tagsApi.getAll,
  })

  const { data: bookmarkedIds = [] } = useQuery<number[]>({
    queryKey: ['bookmark-ids'],
    queryFn: bookmarksApi.getIds,
    enabled: !!user,
  })

  const { data: mySolutions = [] } = useQuery({
    queryKey: ['solutions'],
    queryFn: () => solutionsApi.getAll(),
    enabled: !!user,
  })

  const solutionMap = useMemo(() => {
    const m = new Map<number, number>()
    for (const s of mySolutions) m.set(s.problemId, s.id)
    return m
  }, [mySolutions])

  const bookmarkMutation = useMutation({
    mutationFn: (problemId: number) => bookmarksApi.toggle(problemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookmark-ids'] })
      qc.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })

  return (
    <div className="flex flex-col gap-5">
      {/* 헤더 */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>문제 목록</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text)' }}>총 {total}개 · 문제를 클릭해서 풀이를 등록하세요</p>
      </div>

      {/* 북마클릿 CTA */}
      <Link
        to="/import"
        className="flex items-center gap-3 rounded-xl border p-4 transition-all hover:brightness-110 group"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))',
          borderColor: 'var(--accent-border)',
        }}
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
        >
          <Sparkles size={16} style={{ color: '#fff' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>북마클릿으로 풀이 자동 등록</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
            프로그래머스에서 코드 작성 후 클릭 한 번으로 codexray 로 가져오세요
          </p>
        </div>
        <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--accent-light)' }} />
      </Link>

      {/* 필터 */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border w-80" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <Search size={15} style={{ color: 'var(--text)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="문제 검색..."
            className="bg-transparent outline-none text-sm w-full"
            style={{ color: 'var(--text-h)' }}
          />
        </div>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as ProblemSource | '')}
          className="px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <option value="">전체 출처</option>
          {SOURCES.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
        </select>
        <div ref={tierRef} className="relative">
          <button
            onClick={() => setTierOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm outline-none cursor-pointer"
            style={{
              background: 'var(--bg-card)',
              borderColor: tierActive ? 'var(--accent)' : 'var(--border)',
              color: tierActive ? 'var(--accent-light)' : 'var(--text)',
            }}
          >
            <span>{tierButtonLabel}</span>
            <ChevronDown size={14} />
          </button>
          {tierOpen && (
            <div
              className="absolute left-0 top-full mt-1 z-20 w-[36rem] rounded-lg border p-5 shadow-xl"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <TierRangeSlider value={tierRange} onChange={setTierRange} />
              {tierActive && (
                <button
                  onClick={() => setTierRange([0, TIER_MAX])}
                  className="mt-3 text-xs cursor-pointer hover:underline"
                  style={{ color: 'var(--text)' }}
                >
                  초기화
                </button>
              )}
            </div>
          )}
        </div>
        <select
          value={tagId}
          onChange={(e) => setTagId(e.target.value === '' ? '' : Number(e.target.value))}
          className="px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <option value="">전체 알고리즘</option>
          {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* 테이블 */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
              {user && <th className="px-3 py-3 w-8" />}
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>문제명</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell" style={{ color: 'var(--text)' }}>출처</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell" style={{ color: 'var(--text)' }}>알고리즘</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>티어</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell" style={{ color: 'var(--text)' }}>공식 Lv</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>링크</th>
              {user && <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>풀이</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={user ? 8 : 6} className="text-center py-12" style={{ color: 'var(--text)' }}>불러오는 중...</td></tr>
            ) : problems.length === 0 ? (
              <tr><td colSpan={user ? 8 : 6} className="text-center py-12" style={{ color: 'var(--text)' }}>문제가 없습니다.</td></tr>
            ) : problems.map((p) => (
              <tr
                key={p.id}
                className="border-t transition-colors hover:bg-white/5"
                style={{ borderColor: 'var(--border)' }}
              >
                {user && (
                  <td className="px-3 py-3">
                    <button
                      onClick={() => bookmarkMutation.mutate(p.id)}
                      className="p-1 rounded transition-colors hover:bg-white/10 cursor-pointer"
                      style={{ color: bookmarkedIds.includes(p.id) ? '#f59e0b' : 'var(--text)' }}
                    >
                      <Star size={14} fill={bookmarkedIds.includes(p.id) ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                )}
                <td className="px-4 py-3">
                  <Link to={`/problems/${p.id}`} className="font-medium hover:underline" style={{ color: 'var(--text-h)' }}>
                    {p.title}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <SourceBadge source={p.source} />
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {p.tags.slice(0, 3).map((t) => (
                      <TagBadge key={t.tag.id} name={t.tag.name} />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <TierBadge tier={p.tier} />
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <LevelBadge level={p.level} />
                </td>
                <td className="px-4 py-3">
                  <a
                    href={p.link}
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
                {user && (
                  <td className="px-4 py-3">
                    {solutionMap.has(p.id) ? (
                      <Link
                        to={`/solutions/${solutionMap.get(p.id)}/edit`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:brightness-110"
                        style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: '#10b981', color: '#10b981' }}
                      >
                        <Check size={13} />
                        풀이 수정
                      </Link>
                    ) : (
                      <Link
                        to={`/solutions/new?problemId=${p.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-white/5"
                        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-h)' }}
                      >
                        <PenLine size={13} />
                        풀이 등록
                      </Link>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <ChevronLeft size={14} />
          </button>
          {getPageNumbers(page, totalPages).map((n, i) =>
            n === '...' ? (
              <span key={`e${i}`} className="px-2 text-sm" style={{ color: 'var(--text)' }}>…</span>
            ) : (
              <button
                key={n}
                onClick={() => setPage(n as number)}
                className="min-w-9 px-3 py-2 rounded-lg border text-sm cursor-pointer"
                style={{
                  background: n === page ? 'var(--accent)' : 'var(--bg-card)',
                  borderColor: n === page ? 'var(--accent)' : 'var(--border)',
                  color: n === page ? '#fff' : 'var(--text)',
                }}
              >
                {n}
              </button>
            )
          )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('...')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('...')
  pages.push(total)
  return pages
}
