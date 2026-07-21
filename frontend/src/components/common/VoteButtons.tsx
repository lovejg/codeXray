import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiErrorMessage } from '../../lib/apiError'
import { communityApi } from '../../api/community'
import { useAuthStore } from '../../store/authStore'

interface Props {
  postId: number
  upvotes: number
  downvotes: number
  myVote: number // 1, -1, 0
  disabled?: boolean
}

export default function VoteButtons({ postId, upvotes, downvotes, myVote, disabled }: Props) {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [err, setErr] = useState('')

  const mutation = useMutation({
    mutationFn: async (action: 'up' | 'down' | 'remove') => {
      if (action === 'remove') return communityApi.removeVote(postId)
      return communityApi.vote(postId, action === 'up' ? 1 : -1)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['post', String(postId)] })
      qc.invalidateQueries({ queryKey: ['posts'] })
      setErr('')
    },
    onError: (e) => setErr(getApiErrorMessage(e, '처리 중 오류가 발생했습니다.')),
  })

  const handleClick = (action: 'up' | 'down') => {
    if (!user) return
    const target = action === 'up' ? 1 : -1
    if (myVote === target) mutation.mutate('remove')
    else mutation.mutate(action)
  }

  const baseBtn = 'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer border'

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-2">
        <button
          disabled={disabled || !user || mutation.isPending}
          onClick={() => handleClick('up')}
          className={baseBtn + ' disabled:opacity-50 disabled:cursor-not-allowed'}
          style={{
            background: myVote === 1 ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-hover)',
            color: myVote === 1 ? '#10b981' : 'var(--text)',
            borderColor: myVote === 1 ? '#10b981' : 'var(--border)',
          }}
          title={user ? '' : '로그인 후 투표할 수 있습니다'}
        >
          <ThumbsUp size={14} fill={myVote === 1 ? '#10b981' : 'none'} />
          <span className="tabular-nums">{upvotes}</span>
        </button>
        <button
          disabled={disabled || !user || mutation.isPending}
          onClick={() => handleClick('down')}
          className={baseBtn + ' disabled:opacity-50 disabled:cursor-not-allowed'}
          style={{
            background: myVote === -1 ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-hover)',
            color: myVote === -1 ? '#ef4444' : 'var(--text)',
            borderColor: myVote === -1 ? '#ef4444' : 'var(--border)',
          }}
        >
          <ThumbsDown size={14} fill={myVote === -1 ? '#ef4444' : 'none'} />
          <span className="tabular-nums">{downvotes}</span>
        </button>
      </div>
      {err && <span className="text-xs" style={{ color: '#ef4444' }}>{err}</span>}
    </div>
  )
}
