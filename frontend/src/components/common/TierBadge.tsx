import { type Tier, FAMILY_COLORS, parseTier } from '../../lib/tier'

export default function TierBadge({ tier, size = 'sm' }: { tier: Tier | null | undefined; size?: 'sm' | 'md' }) {
  if (!tier) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
        style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}>
        Unrated
      </span>
    )
  }
  const { family, sub } = parseTier(tier)
  const colors = FAMILY_COLORS[family]
  const label = `${family.charAt(0) + family.slice(1).toLowerCase()} ${sub}`
  const isLg = size === 'md'
  return (
    <span
      className={`inline-flex items-center rounded font-semibold ${isLg ? 'px-2.5 py-1 text-sm' : 'px-2 py-0.5 text-xs'}`}
      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
    >
      {label}
    </span>
  )
}
