import { Link, useNavigate } from 'react-router-dom'
import { Code2, BookOpen, Puzzle, Users, LogOut, User, NotebookPen, Star, Megaphone, ShieldCheck } from 'lucide-react'
import { useAuthStore, useIsAdmin } from '../../store/authStore'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const isAdmin = useIsAdmin()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="border-b sticky top-0 z-50" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg" style={{ color: 'var(--accent-light)' }}>
            <Code2 size={22} />
            <span>CodeXray</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            <NavLink to="/problems" icon={<Puzzle size={15} />} label="문제" />
            {user && <NavLink to="/my-problems" icon={<Star size={15} />} label="나의 문제" />}
            <NavLink to="/solutions" icon={<BookOpen size={15} />} label="내 풀이" />
            <NavLink to="/notes" icon={<NotebookPen size={15} />} label="노트" />
            <NavLink to="/community" icon={<Users size={15} />} label="커뮤니티" />
            <NavLink to="/suggestions" icon={<Megaphone size={15} />} label="건의사항" />
            {isAdmin && <NavLink to="/admin/reports" icon={<ShieldCheck size={15} />} label="신고 관리" />}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell />
              <Link to="/profile" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-white/5" style={{ color: 'var(--text)' }}>
                <User size={15} />
                <span>{user.nickname}</span>
              </Link>
              <button onClick={handleLogout} className="p-2 rounded-lg transition-colors hover:bg-white/5 cursor-pointer" style={{ color: 'var(--text)' }}>
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-1.5 text-sm rounded-lg transition-colors hover:bg-white/5" style={{ color: 'var(--text)' }}>
                로그인
              </Link>
              <Link to="/register" className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors" style={{ background: 'var(--accent)', color: '#fff' }}>
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-white/5"
      style={{ color: 'var(--text)' }}
    >
      {icon}
      {label}
    </Link>
  )
}
