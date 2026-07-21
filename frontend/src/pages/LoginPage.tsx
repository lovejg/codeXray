import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Code2 } from 'lucide-react'
import { getApiErrorData } from '../lib/apiError'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import OAuthButtons, { OAuthDivider } from '../components/common/OAuthButtons'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [unverified, setUnverified] = useState<string | null>(null)
  const [resent, setResent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setUnverified(null)
    setResent(false)
    setLoading(true)
    try {
      const data = await authApi.login(form)
      setAuth(data.user, data.accessToken, data.refreshToken)
      navigate('/')
    } catch (err) {
      const resp = getApiErrorData(err)
      const nested = typeof resp?.message === 'object' ? resp.message : undefined
      if (resp?.code === 'EMAIL_NOT_VERIFIED' || nested?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverified(resp?.email ?? nested?.email ?? form.email)
      } else {
        setError(typeof resp?.message === 'string' ? resp.message : '로그인에 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!unverified) return
    try {
      await authApi.resendVerification(unverified)
      setResent(true)
    } catch {
      setResent(true) // 존재 여부 노출 방지 — 항상 성공 UI
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Code2 size={28} style={{ color: 'var(--accent-light)' }} />
            <span className="text-2xl font-bold" style={{ color: 'var(--accent-light)' }}>CodeXray</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text)' }}>프로그래머스 풀이 관리 플랫폼</p>
        </div>

        <div className="rounded-xl p-6 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-semibold mb-5" style={{ color: 'var(--text-h)' }}>로그인</h2>

          <OAuthButtons mode="login" />
          <OAuthDivider />

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="px-3 py-2 rounded-lg text-sm outline-none border transition-colors"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-h)' }}
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>비밀번호</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="px-3 py-2 rounded-lg text-sm outline-none border transition-colors"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-h)' }}
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
            {unverified && (
              <div className="rounded-lg border p-3 flex flex-col gap-2" style={{ background: 'var(--bg-hover)', borderColor: 'var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--text-h)' }}>
                  이메일 인증이 완료되지 않았습니다. 받은 편지함에서 인증 메일을 확인해주세요.
                </p>
                {resent ? (
                  <p className="text-xs" style={{ color: '#10b981' }}>인증 메일을 다시 발송했습니다.</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-xs font-medium w-fit underline cursor-pointer"
                    style={{ color: 'var(--accent-light)' }}
                  >
                    인증 메일 재전송
                  </button>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-60 cursor-pointer"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
          <p className="text-xs text-center mt-4" style={{ color: 'var(--text)' }}>
            계정이 없으신가요?{' '}
            <Link to="/register" style={{ color: 'var(--accent-light)' }}>회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

