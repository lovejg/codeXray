import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, Trash2, Inbox } from 'lucide-react'
import { notificationsApi } from '../../api/notifications'
import type { Notification } from '../../types'
import { formatNotification, relativeTime } from '../../utils/formatNotification'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 30_000,
  })

  const { data: items = [] } = useQuery<Notification[]>({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationsApi.list({ limit: 10 }),
    enabled: open, // 드롭다운 열 때만 fetch
  })

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markReadMutation = useMutation({
    mutationFn: (ids: number[]) => notificationsApi.markRead(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.deleteOne(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const handleItemClick = (n: Notification) => {
    const f = formatNotification(n)
    if (!n.isRead) markReadMutation.mutate([n.id])
    setOpen(false)
    navigate(f.link)
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="알림"
        className="relative p-2 rounded-lg cursor-pointer transition-colors hover:bg-white/5"
        style={{ color: 'var(--text)' }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums"
            style={{ background: '#ef4444', color: '#fff' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-xl border shadow-lg z-50 flex flex-col overflow-hidden"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <span className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>알림</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="text-xs flex items-center gap-1 cursor-pointer hover:underline disabled:opacity-60"
                style={{ color: 'var(--accent-light)' }}
              >
                <Check size={11} />
                모두 읽음
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 px-4 text-center" style={{ color: 'var(--text)' }}>
                <Inbox size={20} style={{ opacity: 0.5 }} />
                <span className="text-xs">새 알림이 없습니다</span>
              </div>
            ) : (
              items.map((n) => {
                const f = formatNotification(n)
                return (
                  <div
                    key={n.id}
                    className="border-b transition-colors cursor-pointer hover:bg-white/5 group"
                    style={{ borderColor: 'var(--border)', background: n.isRead ? 'transparent' : 'rgba(96, 165, 250, 0.04)' }}
                    onClick={() => handleItemClick(n)}
                  >
                    <div className="px-4 py-3 flex items-start gap-2.5">
                      <span
                        className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                        style={{ background: 'var(--bg-hover)', color: f.color }}
                      >
                        {f.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-h)' }}>
                          {f.title}
                          {!n.isRead && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#3b82f6' }} />}
                        </p>
                        <p className="text-xs mt-0.5 leading-relaxed line-clamp-2" style={{ color: 'var(--text)' }}>
                          {f.body}
                        </p>
                        <p className="text-[10px] mt-1" style={{ color: 'var(--text)', opacity: 0.6 }}>
                          {relativeTime(n.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteMutation.mutate(n.id)
                        }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                        style={{ color: 'var(--text)' }}
                        aria-label="삭제"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="px-4 py-2.5 text-xs text-center border-t cursor-pointer hover:bg-white/5"
            style={{ borderColor: 'var(--border)', color: 'var(--accent-light)' }}
          >
            전체 알림 보기
          </Link>
        </div>
      )}
    </div>
  )
}
