import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Code2, Loader2, XCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function OAuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [error, setError] = useState('')

  useEffect(() => {
    const err = params.get('error')
    if (err) {
      setError(err)
      return
    }
    const token = params.get('token')
    const userRaw = params.get('user')
    if (!token || !userRaw) {
      setError('OAuth 응답이 올바르지 않습니다.')
      return
    }
    try {
      const user = JSON.parse(userRaw)
      setAuth(user, token)
      navigate('/', { replace: true })
    } catch {
      setError('OAuth 응답을 해석할 수 없습니다.')
    }
  }, [params, setAuth, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Code2 size={28} style={{ color: 'var(--accent-light)' }} />
          <span className="text-2xl font-bold" style={{ color: 'var(--accent-light)' }}>CodeXray</span>
        </div>
        <div className="rounded-xl p-8 border flex flex-col items-center gap-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {error ? (
            <>
              <XCircle size={40} style={{ color: '#ef4444' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-h)' }}>Google 로그인에 실패했습니다</p>
              <p className="text-xs" style={{ color: 'var(--text)' }}>{error}</p>
              <Link to="/login" className="text-xs mt-2" style={{ color: 'var(--accent-light)' }}>
                로그인 페이지로 이동
              </Link>
            </>
          ) : (
            <>
              <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent-light)' }} />
              <p className="text-sm" style={{ color: 'var(--text)' }}>로그인 처리 중...</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
