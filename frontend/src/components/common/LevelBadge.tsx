const LEVEL_STYLES: Record<number, { bg: string; text: string; label: string }> = {
  0: { bg: '#1f2937', text: '#9ca3af', label: 'Lv.0' },
  1: { bg: '#064e3b', text: '#10b981', label: 'Lv.1' },
  2: { bg: '#1e3a5f', text: '#3b82f6', label: 'Lv.2' },
  3: { bg: '#451a03', text: '#f59e0b', label: 'Lv.3' },
  4: { bg: '#450a0a', text: '#ef4444', label: 'Lv.4' },
  5: { bg: '#2e1065', text: '#a855f7', label: 'Lv.5' },
}

export default function LevelBadge({ level }: { level: number }) {
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES[0]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
      style={{ background: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  )
}
