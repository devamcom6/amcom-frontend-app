import { del, download, get, getPaginated, patch, post, put } from '@/services/http/client'
import type {
  AdminAccount,
  AdminEstate,
  AdminInvestment,
  AdminListing,
  AdminRequest,
  AdminUser,
  AdminUserDetail,
  BulkActionPayload,
  BulkActionResult,
  DashboardStats,
  DateRange,
  FaqItem,
  InviteAdminPayload,
  ListQuery,
  Media,
  PermissionDefinition,
  Report,
  ReportQuery,
  ReviewListingPayload,
  Role,
  RoleDefinition,
  SystemSettings,
  Testimonial,
  Transaction,
  UserBulkAction,
} from '@/types'

/**
 * /api/v1/admin/* — BACKEND_API_CONTRACT.md §15.
 * Every endpoint MUST be protected server-side by role + permission middleware;
 * hiding UI here is only a convenience.
 */
export const adminService = {
  dashboard: (range: DateRange) => get<DashboardStats>('/admin/dashboard', { params: range }),

  /* Users */
  users: (query: ListQuery) => getPaginated<AdminUser>('/admin/users', { params: query }),
  user: (id: number) => get<AdminUserDetail>(`/admin/users/${id}`),
  setUserStatus: (id: number, status: 'active' | 'suspended', reason?: string) =>
    patch<AdminUser>(`/admin/users/${id}/status`, { status, reason }),
  bulkUsers: (payload: BulkActionPayload<UserBulkAction>) => post<BulkActionResult>('/admin/users/bulk', payload),

  /* Estates (buyback inventory) */
  estates: (query: ListQuery) => getPaginated<AdminEstate>('/admin/estates', { params: query }),
  setEstatePublished: (id: number, isPublished: boolean) =>
    patch<AdminEstate>(`/admin/estates/${id}`, { is_published: isPublished }),

  /* Listing verification queue */
  listings: (query: ListQuery) => getPaginated<AdminListing>('/admin/listings', { params: query }),
  reviewListing: (id: number, payload: ReviewListingPayload) =>
    post<AdminListing>(`/admin/listings/${id}/review`, payload),

  /* Investments (buyback orders + capital investments) */
  investments: (query: ListQuery) => getPaginated<AdminInvestment>('/admin/investments', { params: query }),
  updateInvestmentStatus: (id: number, status: string) =>
    patch<AdminInvestment>(`/admin/investments/${id}/status`, { status }),

  /* Transactions */
  transactions: (query: ListQuery) => getPaginated<Transaction>('/admin/transactions', { params: query }),
  requeryTransaction: (reference: string) => post<Transaction>(`/admin/transactions/${reference}/requery`),

  /* Leads & requests (interests, applications, inspections, contact, support) */
  requests: (query: ListQuery) => getPaginated<AdminRequest>('/admin/requests', { params: query }),
  updateRequest: (id: number, payload: { status?: AdminRequest['status']; assigned_to_me?: boolean }) =>
    patch<AdminRequest>(`/admin/requests/${id}`, payload),

  /* Content */
  faqs: (query: ListQuery) => getPaginated<FaqItem>('/admin/content/faqs', { params: query }),
  saveFaq: (faq: Partial<FaqItem> & Pick<FaqItem, 'question' | 'answer' | 'product'>) =>
    faq.id ? put<FaqItem>(`/admin/content/faqs/${faq.id}`, faq) : post<FaqItem>('/admin/content/faqs', faq),
  deleteFaq: (id: number) => del(`/admin/content/faqs/${id}`),
  testimonials: (query: ListQuery) => getPaginated<Testimonial>('/admin/content/testimonials', { params: query }),
  setTestimonialPublished: (id: number, isPublished: boolean) =>
    patch<Testimonial>(`/admin/content/testimonials/${id}`, { is_published: isPublished }),

  /* Media library */
  media: (query: ListQuery) => getPaginated<Media>('/admin/media', { params: query }),

  /* Reports */
  report: (query: ReportQuery) => get<Report>(`/admin/reports/${query.type}`, { params: query }),
  exportReport: (query: ReportQuery) =>
    download(`/admin/reports/${query.type}/export`, { params: { ...query, format: 'csv' } }),

  /* System settings */
  settings: () => get<SystemSettings>('/admin/settings'),
  saveSettings: (payload: SystemSettings) => put<SystemSettings>('/admin/settings', payload),

  /* Super admin: administrators, roles & permissions */
  admins: (query: ListQuery) => getPaginated<AdminAccount>('/admin/admins', { params: query }),
  inviteAdmin: (payload: InviteAdminPayload) => post<AdminAccount>('/admin/admins', payload),
  changeAdminRole: (id: number, role: Exclude<Role, 'user'>) => patch<AdminAccount>(`/admin/admins/${id}`, { role }),
  revokeAdmin: (id: number) => del(`/admin/admins/${id}`),
  roles: () => get<RoleDefinition[]>('/admin/roles'),
  permissions: () => get<PermissionDefinition[]>('/admin/permissions'),
  updateRolePermissions: (id: number, permissions: string[]) =>
    put<RoleDefinition>(`/admin/roles/${id}/permissions`, { permissions }),
}
