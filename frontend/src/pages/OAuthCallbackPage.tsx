import { useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Code2, Loader2, XCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types'

export default function OAuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const oauthError = params.get('error')
  const token = params.get('token')
  const refreshToken = params.get('refreshToken')
  const userRaw = params.get('user')

  // URL 파라미터를 렌더 중에 해석 — 성공 시에만 effect에서 로그인 처리한다.
  const result = useMemo(():
    | { user: User; token: string; refreshToken: string }
    | { error: string } => {
    if (oauthError) return { error: oauthError }
    if (!token || !refreshToken || !userRaw) {
      return { error: 'OAuth 응답이 올바르지 않습니다.' }
    }
    try {
      return { user: JSON.parse(userRaw) as User, token, refreshToken }
    } catch {
      return { error: 'OAuth 응답을 해석할 수 없습니다.' }
    }
  }, [oauthError, token, refreshToken, userRaw])

  const error = 'error' in result ? result.error : ''

  useEffect(() => {
    if ('user' in result) {
      setAuth(result.user, result.token, result.refreshToken)
      navigate('/', { replace: true })
    }
  }, [result, setAuth, navigate])

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
