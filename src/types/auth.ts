import type { ISODate, ISODateTime } from './api'
import type { Media } from './media'

export type Role = 'user' | 'admin' | 'super_admin'

export type Permission =
  | 'dashboard.view'
  | 'users.view'
  | 'users.manage'
  | 'admins.manage'
  | 'roles.manage'
  | 'estates.view'
  | 'estates.manage'
  | 'listings.view'
  | 'listings.review'
  | 'investments.view'
  | 'investments.manage'
  | 'transactions.view'
  | 'transactions.manage'
  | 'requests.view'
  | 'requests.manage'
  | 'content.manage'
  | 'media.manage'
  | 'reports.view'
  | 'reports.export'
  | 'settings.view'
  | 'settings.manage'

export type KycStatus = 'unverified' | 'pending' | 'verified' | 'failed'
export type AccountStatus = 'active' | 'suspended' | 'pending_deletion'

export interface AuthUser {
  id: number
  first_name: string | null
  last_name: string | null
  name: string
  email: string
  phone: string | null
  avatar: Media | null
  role: Role
  permissions: Permission[]
  status: AccountStatus
  email_verified_at: ISODateTime | null
  kyc_status: KycStatus
  /** True once the 4-step profile setup (ID, personal, contact, next of kin) is complete. */
  profile_completed: boolean
  two_factor_enabled: boolean
  created_at: ISODateTime
}

export interface LoginPayload {
  email: string
  password: string
  remember?: boolean
  /** Sent on the second attempt when the API answered with `two_factor_required`. */
  two_factor_code?: string
}

export interface RegisterPayload {
  email: string
  password: string
  password_confirmation: string
}

export interface AuthSession {
  user: AuthUser
  token: string
  token_type: 'Bearer'
  expires_at: ISODateTime | null
}

export interface TwoFactorChallenge {
  two_factor_required: true
  channel: 'sms' | 'email'
  masked_destination: string
}

export type LoginResult = AuthSession | TwoFactorChallenge

export interface VerifyEmailPayload {
  code: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface VerifyResetCodePayload {
  email: string
  code: string
}

export interface VerifyResetCodeResponse {
  reset_token: string
  expires_at: ISODateTime
}

export interface ResetPasswordPayload {
  email: string
  reset_token: string
  password: string
  password_confirmation: string
}

export interface ChangePasswordPayload {
  current_password: string
  password: string
  password_confirmation: string
}

export interface GoogleRedirectResponse {
  url: string
}

export interface LoginActivity {
  id: number
  date: ISODate
  device: string
  location: string | null
  ip_address: string | null
  status: 'current' | 'active' | 'signed_out'
}
