import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Flag, X } from 'lucide-react'
import { getApiErrorMessage } from '../../lib/apiError'
import { communityApi } from '../../api/community'

interface Props {
  postId: number
  onClose: () => void
}

const REASONS = [
  '정답이 아닌 코드 같음',
  '욕설/비방',
  '스팸/광고',
  '저작권/개인정보 포함',
  '기타',
]

export default function ReportModal({ postId, onClose }: Props) {
  const [reason, setReason] = useState(REASONS[0])
  const [custom, setCustom] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const finalReason = reason === '기타' ? custom.trim() : reason

  const mutation = useMutation({
    mutationFn: () => communityApi.report(postId, finalReason),
    onSuccess: () => {
      setDone(true)
      setError('')
    },
    onError: (err) => setError(getApiErrorMessage(err, '신고 처리에 실패했습니다.')),
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border p-5 flex flex-col gap-4"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-h)' }}>
            <Flag size={15} style={{ color: '#ef4444' }} />
            게시글 신고
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 cursor-pointer" style={{ color: 'var(--text)' }}>
            <X size={16} />
          </button>
        </div>

        {done ? (
          <>
            <p className="text-sm" style={{ color: 'var(--text-h)' }}>신고가 접수되었습니다. 관리자가 확인 후 처리합니다.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              확인
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>신고 사유</label>
              <div className="flex flex-col gap-1">
                {REASONS.map((r) => (
                  <label key={r} className="flex items-center gap-2 text-sm cursor-pointer py-1" style={{ color: 'var(--text-h)' }}>
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                    />
                    {r}
                  </label>
                ))}
              </div>
              {reason === '기타' && (
                <textarea
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  rows={3}
                  placeholder="구체적인 사유를 입력해주세요 (최소 2자)"
                  className="mt-1 px-3 py-2 rounded-lg text-sm outline-none resize-none border"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-h)' }}
                />
              )}
            </div>
            {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
            <div className="flex gap-2 justify-end">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-sm cursor-pointer"
                style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
              >
                취소
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || finalReason.length < 2}
                className="px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-60"
                style={{ background: '#ef4444', color: '#fff' }}
              >
                {mutation.isPending ? '접수 중...' : '신고하기'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
