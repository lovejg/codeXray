export type Tier =
  | 'BRONZE_III' | 'BRONZE_II' | 'BRONZE_I'
  | 'SILVER_III' | 'SILVER_II' | 'SILVER_I'
  | 'GOLD_III' | 'GOLD_II' | 'GOLD_I'
  | 'PLATINUM_III' | 'PLATINUM_II' | 'PLATINUM_I'
  | 'DIAMOND_III' | 'DIAMOND_II' | 'DIAMOND_I'

export const TIER_ORDER: Tier[] = [
  'BRONZE_III', 'BRONZE_II', 'BRONZE_I',
  'SILVER_III', 'SILVER_II', 'SILVER_I',
  'GOLD_III', 'GOLD_II', 'GOLD_I',
  'PLATINUM_III', 'PLATINUM_II', 'PLATINUM_I',
  'DIAMOND_III', 'DIAMOND_II', 'DIAMOND_I',
]

export function tierLabel(tier: Tier): string {
  const [family, sub] = tier.split('_')
  return `${family.charAt(0) + family.slice(1).toLowerCase()} ${sub}`
}

export type TierFamily = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND'

export const TIER_FAMILIES: TierFamily[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']

export const FAMILY_COLORS: Record<TierFamily, { bg: string; text: string; border: string }> = {
  BRONZE:   { bg: '#2a1810', text: '#cd7f32', border: '#6b3e1e' },
  SILVER:   { bg: '#1a1d24', text: '#c0c0c0', border: '#5a6170' },
  GOLD:     { bg: '#2a1f05', text: '#ffd700', border: '#7a5e10' },
  PLATINUM: { bg: '#0a2a28', text: '#7dd3c0', border: '#1f6359' },
  DIAMOND:  { bg: '#0f1a3d', text: '#8ab4f8', border: '#2b4287' },
}

export function familyLabel(family: TierFamily): string {
  return family.charAt(0) + family.slice(1).toLowerCase()
}

function parseTier(tier: Tier) {
  const [family, sub] = tier.split('_') as [string, string]
  return { family, sub }
}

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
