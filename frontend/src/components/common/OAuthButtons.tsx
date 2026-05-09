import { authApi } from '../../api/auth'

interface Props {
  mode: 'login' | 'register'
}

export default function OAuthButtons({ mode }: Props) {
  const googleLabel = mode === 'login' ? 'Google로 계속하기' : 'Google로 가입'
  const naverLabel = mode === 'login' ? '네이버로 계속하기' : '네이버로 가입'

  return (
    <div className="flex flex-col gap-2 mb-4">
      <a
        href={authApi.googleLoginUrl()}
        className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-white/5"
        style={{ background: 'var(--bg)', color: 'var(--text-h)', borderColor: 'var(--border)' }}
      >
        <GoogleIcon />
        {googleLabel}
      </a>
      <a
        href={authApi.naverLoginUrl()}
        className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
        style={{ background: '#03C75A', color: '#fff' }}
      >
        <NaverIcon />
        {naverLabel}
      </a>
    </div>
  )
}

export function OAuthDivider() {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      <span className="text-xs" style={{ color: 'var(--text)' }}>또는 이메일</span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.3 5.9 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.3 5.9 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.3 2.4-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.5 39.7 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2c-.4.4 6.8-5 6.8-14.8 0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  )
}

function NaverIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fill="#fff" d="M11.3 10.7L7.8 5.5H4v9h4.7v-5.2l3.5 5.2H16v-9h-4.7z"/>
    </svg>
  )
}
