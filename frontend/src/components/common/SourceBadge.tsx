import type { ProblemSource } from '../../types'
import { SOURCE_LABEL } from '../../types'

const SOURCE_STYLES: Record<ProblemSource, { bg: string; text: string }> = {
  PRACTICE:          { bg: '#1f2937', text: '#9ca3af' },
  KAKAO_BLIND:       { bg: '#1a1000', text: '#f59e0b' },
  KAKAO_INTERNSHIP:  { bg: '#1a1000', text: '#fbbf24' },
  KAKAO_CODE:        { bg: '#1a0a00', text: '#fb923c' },
  MONTHLY_CHALLENGE: { bg: '#0f172a', text: '#818cf8' },
  WEEKLY_CHALLENGE:  { bg: '#0f172a', text: '#a5b4fc' },
  PCCE:              { bg: '#1a0a2e', text: '#c4b5fd' },
  PCCP:              { bg: '#1a0a2e', text: '#a78bfa' },
  SUMMER_WINTER:     { bg: '#0a2a1a', text: '#34d399' },
  SQL:               { bg: '#0a1a2e', text: '#38bdf8' },
  OTHER:             { bg: '#1f2937', text: '#6b7280' },
}

export default function SourceBadge({ source }: { source: ProblemSource }) {
  const style = SOURCE_STYLES[source]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: style.bg, color: style.text }}
    >
      {SOURCE_LABEL[source]}
    </span>
  )
}
