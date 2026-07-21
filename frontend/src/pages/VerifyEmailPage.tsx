import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Code2, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { getApiErrorMessage } from '../lib/apiError'

type Status = 'pending' | 'success' | 'error'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const token = params.get('token')
  const [status, setStatus] = useState<Status>(token ? 'pending' : 'error')
  const [error, setError] = useState(token ? '' : '인증 토큰이 없습니다.')

  useEffect(() => {
    if (!token) return

    authApi
      .verifyEmail(token)
      .then((data) => {
        setAuth(data.user, data.accessToken, data.refreshToken)
        setStatus('success')
        setTimeout(() => navigate('/'), 1500)
      })
      .catch((err) => {
        setStatus('error')
        setError(getApiErrorMessage(err, '인증에 실패했습니다.'))
      })
  }, [token, setAuth, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Code2 size={28} style={{ color: 'var(--accent-light)' }} />
          <span className="text-2xl font-bold" style={{ color: 'var(--accent-light)' }}>CodeXray</span>
        </div>

        <div className="rounded-xl p-8 border flex flex-col items-center gap-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {status === 'pending' && (
            <>
              <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent-light)' }} />
              <p className="text-sm" style={{ color: 'var(--text)' }}>이메일 인증 중...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 size={40} style={{ color: '#10b981' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-h)' }}>이메일 인증이 완료되었습니다!</p>
              <p className="text-xs" style={{ color: 'var(--text)' }}>잠시 후 자동으로 이동합니다.</p>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle size={40} style={{ color: '#ef4444' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-h)' }}>인증에 실패했습니다</p>
              <p className="text-xs" style={{ color: 'var(--text)' }}>{error}</p>
              <Link to="/login" className="text-xs mt-2" style={{ color: 'var(--accent-light)' }}>
                로그인 페이지로 이동
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
