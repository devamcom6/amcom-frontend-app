import { DEFAULT_ROLE_PERMISSIONS } from '@/constants/access'
import type { NotificationPreference, PayoutAccount, Profile } from '@/types'
import type { MockUserRecord } from '../db'

const now = new Date()
const iso = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86_400_000).toISOString()

/**
 * Demo accounts (mock mode only — documented in README / handoff):
 *   user@amcom.test        Password123!   fully onboarded investor
 *   new@amcom.test         Password123!   verified email, profile not set up
 *   admin@amcom.test       Password123!   admin
 *   superadmin@amcom.test  Password123!   super admin
 */
export function seedUsers(): MockUserRecord[] {
  return [
    {
      id: 1,
      first_name: 'Adaeze',
      last_name: 'Okonkwo',
      name: 'Adaeze Okonkwo',
      email: 'user@amcom.test',
      phone: '+234 812 345 6789',
      avatar: null,
      role: 'user',
      permissions: DEFAULT_ROLE_PERMISSIONS.user,
      status: 'active',
      email_verified_at: iso(200),
      kyc_status: 'verified',
      profile_completed: true,
      two_factor_enabled: false,
      created_at: iso(200),
      password: 'Password123!',
    },
    {
      id: 2,
      first_name: null,
      last_name: null,
      name: 'new@amcom.test',
      email: 'new@amcom.test',
      phone: null,
      avatar: null,
      role: 'user',
      permissions: DEFAULT_ROLE_PERMISSIONS.user,
      status: 'active',
      email_verified_at: iso(1),
      kyc_status: 'unverified',
      profile_completed: false,
      two_factor_enabled: false,
      created_at: iso(1),
      password: 'Password123!',
    },
    {
      id: 3,
      first_name: 'Tunde',
      last_name: 'Bakare',
      name: 'Tunde Bakare',
      email: 'admin@amcom.test',
      phone: '+234 803 000 1111',
      avatar: null,
      role: 'admin',
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
      status: 'active',
      email_verified_at: iso(400),
      kyc_status: 'verified',
      profile_completed: true,
      two_factor_enabled: false,
      created_at: iso(400),
      password: 'Password123!',
    },
    {
      id: 4,
      first_name: 'Ngozi',
      last_name: 'Eze',
      name: 'Ngozi Eze',
      email: 'superadmin@amcom.test',
      phone: '+234 803 000 2222',
      avatar: null,
      role: 'super_admin',
      permissions: DEFAULT_ROLE_PERMISSIONS.super_admin,
      status: 'active',
      email_verified_at: iso(600),
      kyc_status: 'verified',
      profile_completed: true,
      two_factor_enabled: true,
      created_at: iso(600),
      password: 'Password123!',
    },
  ]
}

export function seedProfiles(users: MockUserRecord[]): Record<number, Omit<Profile, 'user'>> {
  const profiles: Record<number, Omit<Profile, 'user'>> = {}
  for (const u of users) {
    const complete = u.profile_completed
    profiles[u.id] = {
      identity: complete
        ? {
            status: 'verified',
            id_type: 'nin',
            first_name: u.first_name,
            last_name: u.last_name,
            date_of_birth: '1992-05-04',
            gender: 'female',
            nationality: 'Nigerian',
            locked_fields: ['first_name', 'last_name', 'date_of_birth', 'gender', 'nationality'],
          }
        : null,
      personal: {
        first_name: u.first_name,
        last_name: u.last_name,
        date_of_birth: complete ? '1992-05-04' : null,
        gender: complete ? 'female' : null,
        nationality: complete ? 'Nigerian' : null,
        state_of_origin: complete ? 'Rivers' : null,
        lga: complete ? 'Port Harcourt' : null,
      },
      contact: {
        country: complete ? 'Nigeria' : null,
        state: complete ? 'Rivers' : null,
        city: complete ? 'Port Harcourt' : null,
        address: complete ? '24 Ada George Road, Port Harcourt' : null,
        phone: u.phone,
        alt_phone: complete ? '+234 901 234 5678' : null,
      },
      next_of_kin: complete
        ? { full_name: 'Chinedu Okonkwo', relationship: 'Brother', phone: '+234 803 456 7890', email: 'chinedu.okonkwo@email.com' }
        : null,
      onboarding_step: complete ? 'completed' : 'identity',
    }
  }
  return profiles
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreference[] = [
  { key: 'payment_confirmations', group: 'transactions', label: 'Payment Confirmations', description: 'Get notified when payments are received or processed', enabled: true },
  { key: 'transaction_receipts', group: 'transactions', label: 'Transaction Receipts', description: 'Receive digital receipts for all transactions', enabled: true },
  { key: 'maturity_alerts', group: 'investments', label: 'Maturity Alerts', description: 'Get reminded when your investments are approaching maturity', enabled: true },
  { key: 'renewal_reminders', group: 'investments', label: 'Renewal Reminders', description: 'Receive alerts when buyback or lease terms are due for renewal', enabled: true },
  { key: 'roi_updates', group: 'investments', label: 'ROI Updates', description: 'Monthly updates on your investment returns', enabled: false },
  { key: 'listing_status_changes', group: 'property', label: 'Listing Status Changes', description: 'When your property listing status changes', enabled: true },
  { key: 'maintenance_updates', group: 'property', label: 'Maintenance Updates', description: 'Updates on maintenance requests', enabled: true },
  { key: 'new_inquiry_alerts', group: 'property', label: 'New Inquiry Alerts', description: 'When someone shows interest in your property', enabled: true },
  { key: 'login_alerts', group: 'security', label: 'Login Alerts', description: 'Get notified of new sign-ins to your account', enabled: true },
  { key: 'password_changes', group: 'security', label: 'Password Changes', description: 'Confirmation when your password is updated', enabled: true, locked: true },
]

export const SEED_PAYOUT_ACCOUNTS: Record<number, PayoutAccount[]> = {
  1: [],
}
