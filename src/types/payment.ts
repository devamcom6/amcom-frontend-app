import type { ISODateTime, Naira } from './api'

/** Anything that can be paid for through Paystack. */
export type PayableType = 'buyback_order' | 'capital_investment' | 'listing_fee' | 'holding_payment'

export type PaymentMethod = 'bank_transfer' | 'card'

export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'abandoned' | 'reversed'

export interface InitializePaymentPayload {
  payable_type: PayableType
  payable_id: number
  method: PaymentMethod
  /** Frontend route Paystack should redirect to; backend whitelists the host. */
  callback_url: string
}

/** Returned by Laravel after it calls Paystack `transaction/initialize` with the SECRET key. */
export interface PaymentInitialization {
  reference: string
  authorization_url: string
  access_code: string
  amount: Naira
  currency: 'NGN'
  expires_at: ISODateTime | null
}

export interface PaymentSummaryLine {
  label: string
  value: string
  emphasis?: 'strong' | 'positive'
}

/** The verified payment state. Only Laravel's verification is authoritative. */
export interface PaymentVerification {
  reference: string
  status: PaymentStatus
  amount: Naira
  currency: 'NGN'
  method: PaymentMethod | null
  paid_at: ISODateTime | null
  gateway_response: string | null
  payable_type: PayableType
  payable_id: number
  /** Ready-to-render summary for the success screen. */
  summary: {
    title: string
    sections: PaymentSummaryLine[][]
  }
  /** Where the user should go next (e.g. the position in the dashboard). */
  next_url: string | null
}

export interface Transaction {
  id: number
  reference: string
  user: { id: number; name: string; email: string } | null
  payable_type: PayableType
  description: string
  amount: Naira
  fee: Naira
  currency: 'NGN'
  method: PaymentMethod | null
  status: PaymentStatus
  channel: string | null
  paid_at: ISODateTime | null
  created_at: ISODateTime
}
