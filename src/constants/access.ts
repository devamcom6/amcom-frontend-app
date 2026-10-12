import type { Permission, Role } from '@/types'

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const satisfies Record<string, Role>

export const ADMIN_ROLES: Role[] = ['admin', 'super_admin']

export const ROLE_LABELS: Record<Role, string> = {
  user: 'User',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

/**
 * Default permission sets. The backend is the source of truth — it returns
 * `permissions` on the authenticated user. These defaults exist only so that
 * the mock API and UI documentation stay consistent with the contract.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  user: [],
  admin: [
    'dashboard.view',
    'users.view',
    'users.manage',
    'estates.view',
    'listings.view',
    'listings.review',
    'investments.view',
    'investments.manage',
    'transactions.view',
    'requests.view',
    'requests.manage',
    'content.manage',
    'media.manage',
    'reports.view',
    'reports.export',
    'settings.view',
  ],
  super_admin: [
    'dashboard.view',
    'users.view',
    'users.manage',
    'admins.manage',
    'roles.manage',
    'estates.view',
    'estates.manage',
    'listings.view',
    'listings.review',
    'investments.view',
    'investments.manage',
    'transactions.view',
    'transactions.manage',
    'requests.view',
    'requests.manage',
    'content.manage',
    'media.manage',
    'reports.view',
    'reports.export',
    'settings.view',
    'settings.manage',
  ],
}
