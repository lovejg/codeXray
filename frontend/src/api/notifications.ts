import client from './client'
import type { Notification } from '../types'

export const notificationsApi = {
  list: (params?: { onlyUnread?: boolean; cursor?: number; limit?: number }) =>
    client
      .get<Notification[]>('/notifications', { params })
      .then((r) => r.data),
  unreadCount: () =>
    client.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count),
  markAllRead: () => client.patch('/notifications/read-all').then((r) => r.data),
  markRead: (ids: number[]) => client.patch('/notifications/read', { ids }).then((r) => r.data),
  deleteOne: (id: number) => client.delete(`/notifications/${id}`).then((r) => r.data),
}
