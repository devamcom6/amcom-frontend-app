import type {
  AdminAccount,
  AdminInvestment,
  AdminListing,
  AdminRequest,
  AdminUser,
  AppNotification,
  ListingType,
  PaymentStatus,
  PermissionDefinition,
  PropertyType,
  RoleDefinition,
  SystemSettings,
  Transaction,
} from '@/types'
import { DEFAULT_ROLE_PERMISSIONS } from '@/constants/access'

/** Deterministic PRNG so mock tables look the same on every reload. */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}
const pick = <T>(r: () => number, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)] as T
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

const FIRST = ['Adaeze', 'Tunde', 'Chioma', 'Emeka', 'Funke', 'Ibrahim', 'Ngozi', 'Bola', 'Kelechi', 'Amina', 'Segun', 'Zainab', 'Obinna', 'Yetunde', 'Musa', 'Ifeoma', 'Dapo', 'Halima', 'Chinedu', 'Folake']
const LAST = ['Okonkwo', 'Bakare', 'Nwosu', 'Obi', 'Adeyemi', 'Musa', 'Eze', 'Ahmed', 'Okafor', 'Bello', 'Ogunleye', 'Danjuma', 'Uche', 'Balogun', 'Lawal', 'Okeke']

export function seedAdminUsers(): AdminUser[] {
  const r = rng(42)
  return Array.from({ length: 240 }, (_, i) => {
    const first = pick(r, FIRST)
    const last = pick(r, LAST)
    const invested = r() > 0.4 ? Math.round(r() * 40) * 500_000 : 0
    return {
      id: 100 + i,
      name: `${first} ${last}`,
      email: `${first}.${last}${i}@example.com`.toLowerCase(),
      phone: `+234 80${Math.floor(r() * 10)} ${String(Math.floor(r() * 1e3)).padStart(3, '0')} ${String(Math.floor(r() * 1e4)).padStart(4, '0')}`,
      role: 'user',
      status: r() > 0.92 ? 'suspended' : 'active',
      kyc_status: pick(r, ['verified', 'verified', 'verified', 'pending', 'unverified'] as const),
      email_verified: r() > 0.1,
      investments_count: invested ? 1 + Math.floor(r() * 4) : 0,
      total_invested: invested,
      last_login_at: daysAgo(Math.floor(r() * 60)),
      created_at: daysAgo(Math.floor(r() * 500)),
    }
  })
}

export function seedTransactions(users: AdminUser[]): Transaction[] {
  const r = rng(7)
  const types = ['buyback_order', 'capital_investment', 'listing_fee', 'holding_payment'] as const
  const statuses: PaymentStatus[] = ['success', 'success', 'success', 'success', 'pending', 'failed', 'abandoned']
  return Array.from({ length: 180 }, (_, i) => {
    const u = pick(r, users)
    const type = pick(r, types)
    const amount =
      type === 'listing_fee' ? 25_000 : type === 'holding_payment' ? 250_000 * (1 + Math.floor(r() * 8)) : 1_000_000 * (1 + Math.floor(r() * 20))
    const status = pick(r, statuses)
    const created = daysAgo(Math.floor(r() * 120))
    return {
      id: 9000 + i,
      reference: `PAY-${(0x10000 + i * 7919).toString(36).toUpperCase()}${String(i).padStart(3, '0')}`,
      user: { id: u.id, name: u.name, email: u.email },
      payable_type: type,
      description:
        type === 'buyback_order' ? 'Buyback plot purchase' : type === 'capital_investment' ? 'Capital investment' : type === 'listing_fee' ? 'Listing registration fee' : 'Lease / rent payment',
      amount,
      fee: Math.min(2000, Math.round(amount * 0.015)),
      currency: 'NGN' as const,
      method: (r() > 0.5 ? 'card' : 'bank_transfer') as Transaction['method'],
      status,
      channel: r() > 0.5 ? 'card' : 'bank_transfer',
      paid_at: status === 'success' ? created : null,
      created_at: created,
    }
  }).sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function seedAdminListings(users: AdminUser[]): AdminListing[] {
  const r = rng(99)
  const statuses = ['pending_verification', 'pending_verification', 'published', 'published', 'rejected', 'awaiting_payment', 'sold'] as const
  const titles = ['Oakwood Residences, Apt 4B', '3 Bed Terrace, Ajah', 'Commercial Plaza, GRA', 'Warehouse, Agbara', '2 Bed Flat, Yaba', 'Detached Duplex, Gwarinpa', 'Mini Flat, Rumuola']
  const types: PropertyType[] = ['apartment', 'terrace', 'commercial', 'warehouse', 'apartment', 'duplex', 'apartment']
  const listingTypes: ListingType[] = ['sale', 'rent', 'lease']
  return Array.from({ length: 46 }, (_, i) => {
    const u = pick(r, users)
    const t = i % titles.length
    const status = pick(r, statuses)
    return {
      id: 300 + i,
      reference: `LST-${String(2600 + i)}`,
      title: titles[t] ?? 'Property',
      owner: { id: u.id, name: u.name, email: u.email },
      listing_type: pick(r, listingTypes),
      property_type: types[t] ?? 'apartment',
      city: pick(r, ['Lekki', 'Port Harcourt', 'Abuja', 'Ikeja', 'Yaba']),
      state: pick(r, ['Lagos', 'Rivers', 'FCT']),
      asking_price: 5_000_000 * (1 + Math.floor(r() * 30)),
      status,
      photos_count: 3 + Math.floor(r() * 8),
      fee_paid: status !== 'awaiting_payment',
      submitted_at: daysAgo(Math.floor(r() * 45)),
    }
  })
}

export function seedAdminInvestments(users: AdminUser[]): AdminInvestment[] {
  const r = rng(1234)
  const statuses = ['interest_submitted', 'pending_signature', 'pending_payment', 'active', 'active', 'active', 'matured', 'paid_out'] as const
  return Array.from({ length: 96 }, (_, i) => {
    const u = pick(r, users)
    const buyback = r() > 0.5
    const tenure = buyback ? pick(r, [12, 18, 24, 36]) : pick(r, [6, 12])
    const roi = buyback ? ({ 12: 18, 18: 28, 24: 42, 36: 65 } as Record<number, number>)[tenure] ?? 18 : tenure === 6 ? 18 : 27
    const created = Math.floor(r() * 400)
    return {
      id: 700 + i,
      reference: `${buyback ? 'BB' : 'CI'}-2026-${String(100 + i).padStart(5, '0')}`,
      product: buyback ? 'buyback' : 'capital_investment',
      customer: { id: u.id, name: u.name, email: u.email },
      description: buyback ? `${pick(r, ['Green Lush Estate', 'Estate De Villa', 'Palm Crest Court'])} — 1 plot` : `${tenure}-month plan`,
      principal: 1_000_000 * (1 + Math.floor(r() * 15)),
      roi_percent: roi,
      tenure_months: tenure,
      status: pick(r, statuses),
      maturity_date: new Date(Date.now() + (tenure * 30 - created) * 86_400_000).toISOString().slice(0, 10),
      created_at: daysAgo(created),
    }
  })
}

export function seedRequests(): AdminRequest[] {
  const r = rng(555)
  const kinds = ['interest', 'application', 'inspection', 'contact', 'support'] as const
  const subjects: Record<(typeof kinds)[number], string[]> = {
    interest: ['Buyback — Riverside Gardens (2 plots, 24 months)', 'Capital investment — ₦5,000,000 / 12 months'],
    application: ['Application — 3 Bed Apartment, Lekki Phase 1', 'Application — 4 Bed Duplex, Lekki Phase 1'],
    inspection: ['In-person inspection — 5 Bed Mansion, Ikoyi', 'Virtual inspection — Luxury Penthouse, Lagos Island'],
    contact: ['General enquiry', 'Partnership proposal'],
    support: ['Cannot download investment certificate', 'Update payout account'],
  }
  return Array.from({ length: 64 }, (_, i) => {
    const kind = pick(r, kinds)
    const first = pick(r, FIRST)
    const last = pick(r, LAST)
    return {
      id: 1500 + i,
      kind,
      reference: `REQ-${String(4100 + i)}`,
      name: `${first} ${last}`,
      email: `${first}.${last}@example.com`.toLowerCase(),
      phone: '+234 803 555 0101',
      subject: pick(r, subjects[kind]),
      status: pick(r, ['new', 'new', 'in_progress', 'closed'] as const),
      assigned_to: r() > 0.6 ? 'Tunde Bakare' : null,
      scheduled_for: kind === 'inspection' ? new Date(Date.now() + Math.floor(r() * 14) * 86_400_000).toISOString() : null,
      created_at: daysAgo(Math.floor(r() * 30)),
    }
  })
}

export function seedAdminAccounts(): AdminAccount[] {
  return [
    { id: 3, name: 'Tunde Bakare', email: 'admin@amcom.test', role: 'admin', status: 'active', last_login_at: daysAgo(0), created_at: daysAgo(400) },
    { id: 4, name: 'Ngozi Eze', email: 'superadmin@amcom.test', role: 'super_admin', status: 'active', last_login_at: daysAgo(0), created_at: daysAgo(600) },
    { id: 5, name: 'Kelechi Okafor', email: 'kelechi@amcom.com', role: 'admin', status: 'active', last_login_at: daysAgo(3), created_at: daysAgo(120) },
    { id: 6, name: 'Amina Bello', email: 'amina@amcom.com', role: 'admin', status: 'invited', last_login_at: null, created_at: daysAgo(2) },
  ]
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  { key: 'dashboard.view', group: 'Dashboard', label: 'View dashboard', description: 'Access the admin overview and statistics.' },
  { key: 'users.view', group: 'Users', label: 'View users', description: 'Browse and search customer accounts.' },
  { key: 'users.manage', group: 'Users', label: 'Manage users', description: 'Suspend, reactivate and run bulk actions on customers.' },
  { key: 'admins.manage', group: 'Administration', label: 'Manage administrators', description: 'Invite, change roles of and revoke administrators.' },
  { key: 'roles.manage', group: 'Administration', label: 'Manage roles & permissions', description: 'Change which permissions each role has.' },
  { key: 'estates.view', group: 'Estates', label: 'View estates', description: 'See buyback estates and plot inventory.' },
  { key: 'estates.manage', group: 'Estates', label: 'Manage estates', description: 'Publish/unpublish estates and edit inventory.' },
  { key: 'listings.view', group: 'Listings', label: 'View listings', description: 'See owner-submitted property listings.' },
  { key: 'listings.review', group: 'Listings', label: 'Review listings', description: 'Approve or reject listings after inspection.' },
  { key: 'investments.view', group: 'Investments', label: 'View investments', description: 'See buyback orders and capital investments.' },
  { key: 'investments.manage', group: 'Investments', label: 'Manage investments', description: 'Update investment status and process payouts.' },
  { key: 'transactions.view', group: 'Payments', label: 'View transactions', description: 'See Paystack transactions and statuses.' },
  { key: 'transactions.manage', group: 'Payments', label: 'Manage transactions', description: 'Re-query and reconcile Paystack transactions.' },
  { key: 'requests.view', group: 'Requests', label: 'View requests', description: 'See interests, applications, inspections and messages.' },
  { key: 'requests.manage', group: 'Requests', label: 'Manage requests', description: 'Assign and close requests.' },
  { key: 'content.manage', group: 'Content', label: 'Manage content', description: 'Edit FAQs, testimonials and legal pages.' },
  { key: 'media.manage', group: 'Content', label: 'Manage media', description: 'Upload and remove media in the library.' },
  { key: 'reports.view', group: 'Reports', label: 'View reports', description: 'Access revenue, investment and user reports.' },
  { key: 'reports.export', group: 'Reports', label: 'Export reports', description: 'Download reports as CSV.' },
  { key: 'settings.view', group: 'Settings', label: 'View settings', description: 'See system configuration.' },
  { key: 'settings.manage', group: 'Settings', label: 'Manage settings', description: 'Change fees, limits and system configuration.' },
]

export function seedRoles(): RoleDefinition[] {
  return [
    { id: 1, name: 'user', label: 'User', description: 'Customers who invest, buy, rent or list property.', is_system: true, users_count: 1248, permissions: DEFAULT_ROLE_PERMISSIONS.user },
    { id: 2, name: 'admin', label: 'Admin', description: 'Operations staff who run day-to-day activity.', is_system: false, users_count: 3, permissions: [...DEFAULT_ROLE_PERMISSIONS.admin] },
    { id: 3, name: 'super_admin', label: 'Super Admin', description: 'Full system access. Cannot be edited.', is_system: true, users_count: 1, permissions: DEFAULT_ROLE_PERMISSIONS.super_admin },
  ]
}

export function seedSettings(): SystemSettings {
  return {
    general: {
      support_email: 'info@houvincity.com',
      support_phone: '+234 707 469 3320',
      office_address: '24 Marina Road, Victoria Island, Lagos, Nigeria.',
      maintenance_mode: false,
    },
    fees: { listing_fee: 25_000, sale_service_fee_percent: 5 },
    capital_investment: {
      min_amount: 1_000_000,
      max_self_serve_amount: 50_000_000,
      checkout_mode: 'direct',
      tenures: [
        { months: 6, roi_percent: 18 },
        { months: 12, roi_percent: 27 },
      ],
    },
    notifications: { admin_alert_email: 'ops@amcom.com', send_maturity_reminders_days_before: 30 },
  }
}

export function seedNotifications(): AppNotification[] {
  return [
    { id: 'n-1', category: 'payment', title: 'Payment confirmed', body: 'Your payment of ₦8,500,000 for the 12-month capital plan was verified.', action_url: '/dashboard/capital-investment/1', read_at: null, created_at: daysAgo(0.1) },
    { id: 'n-2', category: 'listing', title: 'Listing under review', body: 'Oakwood Residences, Apt 4B is awaiting inspection by our team.', action_url: '/dashboard/property-management/listings/1', read_at: null, created_at: daysAgo(1) },
    { id: 'n-3', category: 'investment', title: 'Buyback agreement ready to sign', body: 'Sign your Green Lush Estate buyback agreement to receive your post-dated cheque.', action_url: '/dashboard/buyback/1', read_at: null, created_at: daysAgo(3) },
    { id: 'n-4', category: 'security', title: 'New sign-in', body: 'We noticed a new sign-in from Chrome on MacOS in Port Harcourt.', action_url: '/dashboard/settings/security', read_at: daysAgo(4), created_at: daysAgo(4) },
    { id: 'n-5', category: 'inspection', title: 'Inspection reminder', body: 'Your inspection for 5 Bed Mansion, Ikoyi is tomorrow at 10:00.', action_url: null, read_at: daysAgo(8), created_at: daysAgo(9) },
  ]
}
