import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, Trash2, Inbox } from 'lucide-react'
import { notificationsApi } from '../api/notifications'
import type { Notification } from '../types'
import { formatNotification, relativeTime } from '../utils/formatNotification'
import { useAuthStore } from '../store/authStore'

export default function NotificationsPage() {
  const { token } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  useEffect(() => {
    if (!token) navigate('/login')
  }, [token, navigate])

  const { data: items = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', 'page'],
    queryFn: () => notificationsApi.list({ limit: 50 }),
    enabled: !!token,
  })

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markReadMutation = useMutation({
    mutationFn: (ids: number[]) => notificationsApi.markRead(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.deleteOne(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unreadCount = items.filter((i) => !i.isRead).length

  const handleClick = (n: Notification) => {
    const f = formatNotification(n)
    if (!n.isRead) markReadMutation.mutate([n.id])
    navigate(f.link)
  }

  if (!token) return null

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-h)' }}>
          <Bell size={18} />
          알림
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border disabled:opacity-60"
            style={{ background: 'var(--bg-card)', color: 'var(--text-h)', borderColor: 'var(--border)' }}
          >
            <Check size={12} />
            모두 읽음 ({unreadCount})
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-20" style={{ color: 'var(--text)' }}>불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-16 text-center flex flex-col items-center gap-3" style={{ borderColor: 'var(--border)' }}>
          <Inbox size={28} style={{ color: 'var(--text)', opacity: 0.5 }} />
          <p className="font-medium" style={{ color: 'var(--text-h)' }}>알림이 없습니다</p>
          <p className="text-xs" style={{ color: 'var(--text)' }}>커뮤니티 활동을 시작하면 여기에 알림이 모입니다</p>
          <Link
            to="/community"
            className="mt-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            커뮤니티로
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {items.map((n) => {
            const f = formatNotification(n)
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className="border-b last:border-b-0 transition-colors cursor-pointer hover:bg-white/5 group"
                style={{ borderColor: 'var(--border)', background: n.isRead ? 'var(--bg-card)' : 'rgba(96, 165, 250, 0.04)' }}
              >
                <div className="px-5 py-4 flex items-start gap-3">
                  <span
                    className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
                    style={{ background: 'var(--bg-hover)', color: f.color }}
                  >
                    {f.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-h)' }}>
                      {f.title}
                      {!n.isRead && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#3b82f6' }} />}
                    </p>
                    <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text)' }}>
                      {f.body}
                    </p>
                    <p className="text-xs mt-1.5" style={{ color: 'var(--text)', opacity: 0.6 }}>
                      {relativeTime(n.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteMutation.mutate(n.id)
                    }}
                    className="p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                    style={{ color: 'var(--text)' }}
                    aria-label="삭제"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
