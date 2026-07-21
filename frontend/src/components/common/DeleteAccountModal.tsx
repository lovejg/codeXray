import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../lib/apiError'
import { AlertTriangle, X } from 'lucide-react'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import type { AuthProvider } from '../../types'

interface Props {
  provider: AuthProvider
  nickname: string
  onClose: () => void
}

export default function DeleteAccountModal({ provider, nickname, onClose }: Props) {
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  const isLocal = provider === 'LOCAL'

  const mutation = useMutation({
    mutationFn: () =>
      authApi.deleteAccount(
        isLocal ? { password } : { confirmNickname: confirmText },
      ),
    onSuccess: () => {
      logout()
      navigate('/login', { replace: true })
    },
    onError: (err) => setError(getApiErrorMessage(err, '탈퇴에 실패했습니다.')),
  })

  const canSubmit = isLocal
    ? password.length >= 8
    : confirmText === nickname

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border p-5 flex flex-col gap-4"
        style={{ background: 'var(--bg-card)', borderColor: '#7f1d1d' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: '#ef4444' }}>
            <AlertTriangle size={15} />
            회원 탈퇴
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 cursor-pointer" style={{ color: 'var(--text)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="text-xs flex flex-col gap-1.5 p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.08)', color: 'var(--text-h)' }}>
          <p className="font-medium">탈퇴하면 다음 데이터가 영구 삭제됩니다:</p>
          <ul className="ml-3 list-disc" style={{ color: 'var(--text)' }}>
            <li>등록한 모든 풀이와 메모</li>
            <li>개인 노트</li>
            <li>북마크한 문제 목록</li>
            <li>커뮤니티 / 건의사항 글과 댓글</li>
            <li>난이도 피드백 기록</li>
          </ul>
          <p className="mt-1" style={{ color: '#ef4444' }}>이 작업은 되돌릴 수 없습니다.</p>
        </div>

        {isLocal ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>현재 비밀번호 확인</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none border"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-h)' }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>
              확인을 위해 닉네임 <span className="font-semibold" style={{ color: 'var(--text-h)' }}>{nickname}</span> 을 입력하세요
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={nickname}
              className="px-3 py-2 rounded-lg text-sm outline-none border"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-h)' }}
            />
          </div>
        )}

        {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}

        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-sm cursor-pointer"
            style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
          >
            취소
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-60"
            style={{ background: '#ef4444', color: '#fff' }}
          >
            {mutation.isPending ? '처리 중...' : '영구 삭제'}
          </button>
        </div>
      </div>
    </div>
  )
}
