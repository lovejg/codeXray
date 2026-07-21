import { useRef } from 'react'
import { TIER_ORDER, tierLabel } from '../../lib/tier'

interface Props {
  value: [number, number]
  onChange: (value: [number, number]) => void
}

const MAX = TIER_ORDER.length - 1 // 14

const FAMILY_STOPS = [
  { idx: 0, label: 'Bronze' },
  { idx: 3, label: 'Silver' },
  { idx: 6, label: 'Gold' },
  { idx: 9, label: 'Platinum' },
  { idx: 12, label: 'Diamond' },
]

export default function TierRangeSlider({ value, onChange }: Props) {
  const [lo, hi] = value
  const trackRef = useRef<HTMLDivElement>(null)

  const startDrag = (which: 'lo' | 'hi') => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const track = trackRef.current
    if (!track) return

    // 드래그 시작 시점의 반대편 핸들 위치를 고정값으로 잡고,
    // 드래그 중인 쪽이 그 값을 넘어가면 sorted로 onChange → 자연스러운 크로스.
    const other = which === 'lo' ? hi : lo

    const update = (clientX: number) => {
      const rect = track.getBoundingClientRect()
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      const next = Math.round(ratio * MAX)
      onChange([Math.min(next, other), Math.max(next, other)])
    }

    update(e.clientX)
    const onMove = (ev: PointerEvent) => update(ev.clientX)
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const pct = (idx: number) => `${(idx / MAX) * 100}%`
  const isFullRange = lo === 0 && hi === MAX

  return (
    <div className="flex flex-col gap-2 select-none">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: 'var(--text)' }}>티어 범위</span>
        <span style={{ color: 'var(--text-h)' }}>
          {isFullRange ? '전체' : `${tierLabel(TIER_ORDER[lo])} ~ ${tierLabel(TIER_ORDER[hi])}`}
        </span>
      </div>
      <div
        ref={trackRef}
        className="relative h-8 flex items-center"
      >
        {/* 전체 트랙 */}
        <div
          className="absolute left-0 right-0 h-1.5 rounded-full"
          style={{ background: 'var(--bg-hover)' }}
        />
        {/* 선택된 구간 */}
        <div
          className="absolute h-1.5 rounded-full"
          style={{
            left: pct(lo),
            right: `calc(100% - ${pct(hi)})`,
            background: 'var(--accent)',
          }}
        />
        {/* 모든 sub-tier 틱 (패밀리 경계는 더 길게) */}
        {TIER_ORDER.map((_, idx) => {
          const isFamilyBoundary = idx % 3 === 0
          return (
            <div
              key={idx}
              className="absolute"
              style={{
                left: pct(idx),
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '1px',
                height: isFamilyBoundary ? '12px' : '6px',
                background: isFamilyBoundary ? 'var(--text)' : 'var(--border)',
                opacity: isFamilyBoundary ? 0.8 : 1,
              }}
            />
          )
        })}
        {/* 왼쪽 핸들 */}
        <button
          onPointerDown={startDrag('lo')}
          className="absolute w-4 h-4 rounded-full border-2 cursor-grab active:cursor-grabbing shadow-md"
          style={{
            left: `calc(${pct(lo)} - 8px)`,
            background: 'var(--accent)',
            borderColor: 'var(--text-h)',
            touchAction: 'none',
          }}
          aria-label="최소 티어"
        />
        {/* 오른쪽 핸들 */}
        <button
          onPointerDown={startDrag('hi')}
          className="absolute w-4 h-4 rounded-full border-2 cursor-grab active:cursor-grabbing shadow-md"
          style={{
            left: `calc(${pct(hi)} - 8px)`,
            background: 'var(--accent)',
            borderColor: 'var(--text-h)',
            touchAction: 'none',
          }}
          aria-label="최대 티어"
        />
      </div>
      <div className="relative h-4 text-[10px]" style={{ color: 'var(--text)' }}>
        {FAMILY_STOPS.map((s) => (
          <span
            key={s.idx}
            className="absolute whitespace-nowrap"
            style={{ left: pct(s.idx), transform: 'translateX(-50%)' }}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
