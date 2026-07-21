import { create } from 'zustand'
import type { User } from '../types'
import { clearTokens, getRefreshToken, setTokens } from '../lib/tokens'
import { authApi } from '../api/auth'

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string, refreshToken: string) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  setAuth: (user, token, refreshToken) => {
    setTokens(token, refreshToken)
    set({ user, token })
  },
  setUser: (user) => set({ user }),
  logout: () => {
    // 서버의 refresh token 세션도 폐기 (실패해도 로컬 로그아웃은 진행)
    const refreshToken = getRefreshToken()
    if (refreshToken) void authApi.logout(refreshToken).catch(() => {})
    clearTokens()
    set({ user: null, token: null })
  },
}))

export const useIsAdmin = () => useAuthStore((s) => s.user?.role === 'ADMIN')
