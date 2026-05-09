import type { PostType } from '../../types'
import { POST_TYPE_LABEL, POST_TYPE_STYLE } from '../../types'

interface Props {
  type: PostType
  size?: 'sm' | 'xs'
}

export default function PostTypeBadge({ type, size = 'sm' }: Props) {
  const s = POST_TYPE_STYLE[type]
  const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
  return (
    <span
      className={`${sizeClass} rounded font-medium inline-flex items-center`}
      style={{ background: s.bg, color: s.text }}
    >
      {POST_TYPE_LABEL[type]}
    </span>
  )
}
