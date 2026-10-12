import type { ISODateTime } from './api'

export type NotificationCategory =
  | 'payment'
  | 'investment'
  | 'listing'
  | 'inspection'
  | 'application'
  | 'account'
  | 'security'
  | 'system'

export interface AppNotification {
  id: string
  category: NotificationCategory
  title: string
  body: string
  /** In-app route (e.g. "/dashboard/capital/12") the notification links to. */
  action_url: string | null
  read_at: ISODateTime | null
  created_at: ISODateTime
}

export interface UnreadCount {
  unread: number
}
