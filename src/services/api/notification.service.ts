import { get, getPaginated, post } from '@/services/http/client'
import type { AppNotification, ListQuery, UnreadCount } from '@/types'

/** /api/v1/notifications/* — BACKEND_API_CONTRACT.md §12 */
export const notificationService = {
  list: (query: ListQuery = {}) => getPaginated<AppNotification>('/notifications', { params: query }),
  unreadCount: () => get<UnreadCount>('/notifications/unread-count'),
  markRead: (id: string) => post<AppNotification>(`/notifications/${id}/read`),
  markAllRead: () => post<null>('/notifications/read-all'),
}
