import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth'

export default function Layout() {
  const { user, token, setUser, logout } = useAuthStore()

  useEffect(() => {
    if (token && !user) {
      authApi.me().then(setUser).catch(() => logout())
    }
  }, [token, user, setUser, logout])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
