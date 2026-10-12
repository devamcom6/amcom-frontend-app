import type { ISODate } from './api'
import type { AuthUser, KycStatus } from './auth'

export type Gender = 'male' | 'female'

export type IdType = 'nin' | 'bvn' | 'drivers_license' | 'international_passport' | 'voters_card'

export interface IdentityVerificationPayload {
  id_type: IdType
  id_number: string
}

/** Fields extracted from the ID by the verification provider (Persona), returned via Laravel. */
export interface VerifiedIdentity {
  status: KycStatus
  id_type: IdType | null
  first_name: string | null
  last_name: string | null
  date_of_birth: ISODate | null
  gender: Gender | null
  nationality: string | null
  /** Field names that came from the ID and can no longer be edited by the user. */
  locked_fields: string[]
}

export interface PersonalInfoPayload {
  first_name?: string
  last_name?: string
  date_of_birth?: ISODate
  gender?: Gender
  nationality?: string
  state_of_origin: string
  lga: string
}

export interface ContactDetailsPayload {
  country: string
  state: string
  city?: string | null
  address: string
  phone: string
  alt_phone?: string | null
}

export interface NextOfKin {
  full_name: string
  relationship: string
  phone: string
  email: string | null
}

export type OnboardingStep = 'identity' | 'personal' | 'contact' | 'next_of_kin' | 'completed'

export interface Profile {
  user: AuthUser
  identity: VerifiedIdentity | null
  personal: {
    first_name: string | null
    last_name: string | null
    date_of_birth: ISODate | null
    gender: Gender | null
    nationality: string | null
    state_of_origin: string | null
    lga: string | null
  }
  contact: {
    country: string | null
    state: string | null
    city: string | null
    address: string | null
    phone: string | null
    alt_phone: string | null
  }
  next_of_kin: NextOfKin | null
  onboarding_step: OnboardingStep
}

export interface UpdateProfilePayload {
  first_name?: string
  last_name?: string
  phone?: string
  alt_phone?: string | null
  country?: string
  state?: string
  city?: string
  address?: string
}

export interface PayoutAccount {
  id: number
  bank_code: string
  bank_name: string
  account_number_masked: string
  account_name: string
  is_default: boolean
}

export interface CreatePayoutAccountPayload {
  bank_code: string
  account_number: string
}

export interface ResolveBankAccountPayload {
  bank_code: string
  account_number: string
}

export interface ResolvedBankAccount {
  account_name: string
  account_number: string
  bank_code: string
}

export interface Bank {
  code: string
  name: string
}

export type NotificationGroup = 'transactions' | 'investments' | 'property' | 'security'

export interface NotificationPreference {
  key: string
  label: string
  description: string
  group: NotificationGroup
  enabled: boolean
  /** Security-critical notifications that cannot be switched off. */
  locked?: boolean
}

export interface SupportTicketPayload {
  category: 'account' | 'payments' | 'investments' | 'property' | 'other'
  subject: string
  message: string
}
