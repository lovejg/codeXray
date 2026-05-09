import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { KeyRound, X, Check } from 'lucide-react'
import { authApi } from '../../api/auth'

interface Props {
  onClose: () => void
}

export default function ChangePasswordModal({ onClose }: Props) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const mutation = useMutation({
    mutationFn: () => authApi.changePassword({ currentPassword: current, newPassword: next }),
    onSuccess: () => setDone(true),
    onError: (err: any) => setError(err.response?.data?.message ?? '비밀번호 변경에 실패했습니다.'),
  })

  const canSubmit =
    current.length >= 8 && next.length >= 8 && next === confirm && !mutation.isPending

  const handleSubmit = () => {
    setError('')
    if (next !== confirm) {
      setError('새 비밀번호 확인이 일치하지 않습니다.')
      return
    }
    mutation.mutate()
  }

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
            <KeyRound size={15} style={{ color: 'var(--accent-light)' }} />
            비밀번호 변경
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 cursor-pointer" style={{ color: 'var(--text)' }}>
            <X size={16} />
          </button>
        </div>

        {done ? (
          <>
            <div className="flex items-center gap-2 text-sm" style={{ color: '#10b981' }}>
              <Check size={14} />
              비밀번호가 변경되었습니다.
            </div>
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
            <Field label="현재 비밀번호" value={current} onChange={setCurrent} />
            <Field label="새 비밀번호 (8자 이상)" value={next} onChange={setNext} />
            <Field label="새 비밀번호 확인" value={confirm} onChange={setConfirm} />
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
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-60"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {mutation.isPending ? '변경 중...' : '변경하기'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>{label}</label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg text-sm outline-none border"
        style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-h)' }}
      />
    </div>
  )
}
