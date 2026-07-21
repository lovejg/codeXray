import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Code2, Mail } from 'lucide-react'
import { getApiErrorMessage } from '../lib/apiError'
import { authApi } from '../api/auth'
import OAuthButtons, { OAuthDivider } from '../components/common/OAuthButtons'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', nickname: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.register(form)
      setSentTo(res.email ?? form.email)
    } catch (err) {
      setError(getApiErrorMessage(err, '회원가입에 실패했습니다.'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!sentTo) return
    try {
      await authApi.resendVerification(sentTo)
    } catch {
      /* 항상 성공 UI */
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
        </div>

        <div className="rounded-xl p-6 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {sentTo ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <Mail size={40} style={{ color: 'var(--accent-light)' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-h)' }}>인증 메일을 보냈어요</h2>
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                <span style={{ color: 'var(--text-h)' }}>{sentTo}</span> 로 발송된 링크를 클릭하면 가입이 완료됩니다.
              </p>
              <p className="text-xs" style={{ color: 'var(--text)', opacity: 0.8 }}>
                메일이 오지 않았나요? 스팸함을 확인하거나 아래에서 재전송할 수 있습니다.
              </p>
              <button
                type="button"
                onClick={handleResend}
                className="text-xs font-medium underline cursor-pointer"
                style={{ color: 'var(--accent-light)' }}
              >
                인증 메일 재전송
              </button>
              <Link to="/login" className="text-xs mt-2" style={{ color: 'var(--text)' }}>
                로그인 페이지로
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-5" style={{ color: 'var(--text-h)' }}>회원가입</h2>

              <OAuthButtons mode="register" />
              <OAuthDivider />

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {(['email', 'nickname', 'password'] as const).map((field) => (
                  <div key={field} className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                      {field === 'email' ? '이메일' : field === 'nickname' ? '닉네임' : '비밀번호'}
                    </label>
                    <input
                      type={field === 'password' ? 'password' : 'text'}
                      value={form[field]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      className="px-3 py-2 rounded-lg text-sm outline-none border"
                      style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-h)' }}
                      required
                    />
                  </div>
                ))}
                {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-60 cursor-pointer"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  {loading ? '처리 중...' : '가입하기'}
                </button>
              </form>
              <p className="text-xs text-center mt-4" style={{ color: 'var(--text)' }}>
                이미 계정이 있으신가요?{' '}
                <Link to="/login" style={{ color: 'var(--accent-light)' }}>로그인</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

