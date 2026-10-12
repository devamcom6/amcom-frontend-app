import type { ISODate, ISODateTime, Naira } from './api'
import type { AccountStatus, KycStatus, Permission, Role } from './auth'
import type { ListingStatus, ListingType, PropertyType } from './property'
import type { OrderStatus } from './investment'
import type { Media } from './media'

export interface DateRange {
  from: ISODate
  to: ISODate
}

export interface DashboardStats {
  range: DateRange
  summary: {
    total_users: number
    active_users: number
    total_transactions: number
    total_revenue: Naira
    assets_under_management: Naira
    pending_listings: number
    open_requests: number
  }
  /** Percentage change versus the previous period of equal length. */
  trends: {
    users: number
    revenue: number
    transactions: number
    assets_under_management: number
  }
  revenue_series: { label: string; value: Naira }[]
  signups_series: { label: string; value: number }[]
  status_distribution: { key: string; label: string; value: number }[]
  transaction_summary: { status: string; count: number; amount: Naira }[]
  recent_activity: ActivityItem[]
}

export interface ActivityItem {
  id: number
  actor: string
  action: string
  subject: string
  created_at: ISODateTime
}

export interface AdminUser {
  id: number
  name: string
  email: string
  phone: string | null
  role: Role
  status: AccountStatus
  kyc_status: KycStatus
  email_verified: boolean
  investments_count: number
  total_invested: Naira
  last_login_at: ISODateTime | null
  created_at: ISODateTime
}

export interface AdminUserDetail extends AdminUser {
  address: string | null
  next_of_kin: { full_name: string; relationship: string; phone: string } | null
  positions: { reference: string; product: string; principal: Naira; status: string }[]
  recent_transactions: { reference: string; amount: Naira; status: string; date: ISODate }[]
}

export type UserBulkAction = 'suspend' | 'activate' | 'resend_verification' | 'export'

export interface BulkActionPayload<A extends string> {
  action: A
  ids: number[]
}

export interface BulkActionResult {
  processed: number
  failed: number
}

export interface AdminListing {
  id: number
  reference: string
  title: string
  owner: { id: number; name: string; email: string }
  listing_type: ListingType
  property_type: PropertyType
  city: string
  state: string
  asking_price: Naira
  status: ListingStatus
  photos_count: number
  fee_paid: boolean
  submitted_at: ISODateTime | null
}

export interface ReviewListingPayload {
  decision: 'approve' | 'reject'
  reason?: string | null
}

export interface AdminInvestment {
  id: number
  reference: string
  product: 'buyback' | 'capital_investment'
  customer: { id: number; name: string; email: string }
  description: string
  principal: Naira
  roi_percent: number
  tenure_months: number
  status: OrderStatus
  maturity_date: ISODate | null
  created_at: ISODateTime
}

export type RequestKind = 'interest' | 'application' | 'inspection' | 'contact' | 'support'

export interface AdminRequest {
  id: number
  kind: RequestKind
  reference: string
  name: string
  email: string
  phone: string | null
  subject: string
  status: 'new' | 'in_progress' | 'closed'
  assigned_to: string | null
  scheduled_for: ISODateTime | null
  created_at: ISODateTime
}

export interface AdminEstate {
  id: number
  name: string
  slug: string
  city: string
  state: string
  total_plots: number
  available_plots: number
  reserved_plots: number
  sold_plots: number
  checkout_mode: 'interest' | 'direct'
  is_published: boolean
}

export interface AdminAccount {
  id: number
  name: string
  email: string
  role: Exclude<Role, 'user'>
  status: AccountStatus | 'invited'
  last_login_at: ISODateTime | null
  created_at: ISODateTime
}

export interface InviteAdminPayload {
  name: string
  email: string
  role: Exclude<Role, 'user'>
}

export interface RoleDefinition {
  id: number
  name: Role
  label: string
  description: string
  is_system: boolean
  users_count: number
  permissions: Permission[]
}

export interface PermissionDefinition {
  key: Permission
  label: string
  group: string
  description: string
}

export type ReportType = 'revenue' | 'investments' | 'users' | 'listings'

export interface ReportQuery extends DateRange {
  type: ReportType
  group_by: 'day' | 'week' | 'month'
}

export interface Report {
  type: ReportType
  range: DateRange
  group_by: 'day' | 'week' | 'month'
  totals: { label: string; value: number; format: 'currency' | 'number' | 'percent' }[]
  series: { label: string; value: number }[]
  rows: Record<string, string | number>[]
  columns: { key: string; label: string; format?: 'currency' | 'number' | 'date' }[]
}

export interface SystemSettings {
  general: {
    support_email: string
    support_phone: string
    office_address: string
    maintenance_mode: boolean
  }
  fees: {
    listing_fee: Naira
    sale_service_fee_percent: number
  }
  capital_investment: {
    min_amount: Naira
    max_self_serve_amount: Naira
    checkout_mode: 'interest' | 'direct'
    tenures: { months: number; roi_percent: number }[]
  }
  notifications: {
    admin_alert_email: string
    send_maturity_reminders_days_before: number
  }
}

export interface FaqItem {
  id: number
  product: 'buyback' | 'capital_investment' | 'property_management' | 'general'
  question: string
  answer: string
  position: number
  is_published: boolean
}

export interface Testimonial {
  id: number
  quote: string
  author_name: string
  author_title: string
  avatar: Media | null
  is_published: boolean
}
