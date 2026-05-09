import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface Props {
  text: string
  label?: string
  size?: number // 아이콘 크기
  className?: string
}

export default function CopyButton({ text, label = '전체 복사', size = 12, className }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // navigator.clipboard 가 막힌 환경 (iframe, http 등) fallback
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      try { document.execCommand('copy') } catch { /* ignore */ }
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors hover:bg-white/5 ${className ?? ''}`}
      style={{ color: copied ? '#10b981' : 'var(--text)' }}
    >
      {copied ? <Check size={size} /> : <Copy size={size} />}
      <span>{copied ? '복사됨' : label}</span>
    </button>
  )
}
