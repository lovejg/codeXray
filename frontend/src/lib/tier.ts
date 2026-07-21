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

export function parseTier(tier: Tier): { family: TierFamily; sub: string } {
  const [family, sub] = tier.split('_') as [TierFamily, string]
  return { family, sub }
}
