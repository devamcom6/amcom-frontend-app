import { del, get, post, put, upload } from '@/services/http/client'
import type {
  ContactDetailsPayload,
  CreatePayoutAccountPayload,
  IdentityVerificationPayload,
  LoginActivity,
  Media,
  NextOfKin,
  NotificationPreference,
  PayoutAccount,
  PersonalInfoPayload,
  Profile,
  ResolveBankAccountPayload,
  ResolvedBankAccount,
  SupportTicketPayload,
  UpdateProfilePayload,
  VerifiedIdentity,
} from '@/types'

/** /api/v1/profile/*, /api/v1/account/* — see BACKEND_API_CONTRACT.md §5 */
export const profileService = {
  get: () => get<Profile>('/profile'),

  update: (payload: UpdateProfilePayload) => put<Profile>('/profile', payload),

  uploadAvatar: (file: File, onProgress?: (p: number) => void) => {
    const form = new FormData()
    form.append('avatar', file)
    return upload<Media>('/profile/avatar', form, onProgress)
  },

  /* Onboarding (profile set-up) */
  verifyIdentity: (payload: IdentityVerificationPayload) => post<VerifiedIdentity>('/profile/identity/verify', payload),
  savePersonal: (payload: PersonalInfoPayload) => put<Profile>('/profile/personal', payload),
  saveContact: (payload: ContactDetailsPayload) => put<Profile>('/profile/contact', payload),
  saveNextOfKin: (payload: NextOfKin) => put<Profile>('/profile/next-of-kin', payload),

  /* Payout details */
  payoutAccounts: () => get<PayoutAccount[]>('/account/payout-accounts'),
  resolveBankAccount: (payload: ResolveBankAccountPayload) =>
    post<ResolvedBankAccount>('/account/payout-accounts/resolve', payload),
  addPayoutAccount: (payload: CreatePayoutAccountPayload) => post<PayoutAccount>('/account/payout-accounts', payload),
  removePayoutAccount: (id: number) => del(`/account/payout-accounts/${id}`),

  /* Notification preferences */
  notificationPreferences: () => get<NotificationPreference[]>('/account/notification-preferences'),
  saveNotificationPreferences: (prefs: Record<string, boolean>) =>
    put<NotificationPreference[]>('/account/notification-preferences', { preferences: prefs }),

  /* Security */
  loginActivity: () => get<LoginActivity[]>('/account/sessions'),
  revokeSession: (id: number) => del(`/account/sessions/${id}`),
  enableTwoFactor: () => post<{ channel: 'sms' | 'email'; masked_destination: string }>('/account/two-factor/enable'),
  confirmTwoFactor: (code: string) => post<{ recovery_codes: string[] }>('/account/two-factor/confirm', { code }),
  disableTwoFactor: (password: string) => post<null>('/account/two-factor/disable', { password }),

  /* Phone change (OTP to active devices) */
  requestPhoneChange: (phone: string) => post<{ masked_destination: string }>('/account/phone/change-request', { phone }),
  confirmPhoneChange: (phone: string, code: string) => post<Profile>('/account/phone/change-confirm', { phone, code }),

  /* Danger zone */
  deleteAccount: (confirmation: 'DELETE') => del('/account', { data: { confirmation } }),

  /* Help & support */
  createSupportTicket: (payload: SupportTicketPayload) =>
    post<{ reference: string }>('/support/tickets', payload),
}
