import type { ISODate, ISODateTime, Naira } from './api'
import type { DocumentFile, Media } from './media'

export interface Location {
  address: string | null
  city: string
  state: string
  latitude: number | null
  longitude: number | null
}

/**
 * How a product is purchased:
 * - `interest`: lead capture only. An agent follows up offline ("Interest Submitted").
 * - `direct`: the customer signs the agreement and pays online via Paystack.
 */
export type CheckoutMode = 'interest' | 'direct'

export interface TenureOption {
  months: number
  roi_percent: number
}

/* ------------------------------------------------------------------ */
/* Buyback                                                             */
/* ------------------------------------------------------------------ */

export interface EstateSummary {
  id: number
  slug: string
  name: string
  location: Location
  size_sqm: number
  tenure_min_months: number
  tenure_max_months: number
  roi_min_percent: number
  roi_max_percent: number
  price_from: Naira
  available_plots: number
  cover_image: Media
}

export interface Estate extends EstateSummary {
  description: string
  gallery: Media[]
  tenures: TenureOption[]
  checkout_mode: CheckoutMode
  max_plots_per_order: number
}

export type PlotStatus = 'available' | 'reserved' | 'sold'

export interface Plot {
  id: number
  code: string
  size_sqm: number
  price: Naira
  status: PlotStatus
}

export interface BuybackQuote {
  plot_count: number
  total_price: Naira
  tenure_months: number
  roi_percent: number
  projected_return: Naira
  profit: Naira
  maturity_date: ISODate
}

export interface ContactDetails {
  full_name: string
  email: string
  phone: string
  alt_phone?: string | null
  note?: string | null
}

export interface BuybackInterestPayload extends ContactDetails {
  estate_id: number
  plot_ids: number[]
  tenure_months: number
}

export interface CreateBuybackOrderPayload {
  estate_id: number
  plot_ids: number[]
  tenure_months: number
}

export type OrderStatus =
  | 'interest_submitted'
  | 'pending_signature'
  | 'pending_payment'
  | 'payment_processing'
  | 'active'
  | 'matured'
  | 'paid_out'
  | 'cancelled'

export interface BuybackOrder {
  id: number
  reference: string
  status: OrderStatus
  estate: Pick<EstateSummary, 'id' | 'slug' | 'name' | 'location'>
  plots: Pick<Plot, 'id' | 'code' | 'size_sqm'>[]
  quote: BuybackQuote
  agreement_signed_at: ISODateTime | null
  created_at: ISODateTime
}

export interface InterestSubmission {
  id: number
  reference: string
  product: 'buyback' | 'capital_investment'
  status: 'received' | 'contacted' | 'converted' | 'closed'
  created_at: ISODateTime
}

/* ------------------------------------------------------------------ */
/* Capital investment                                                   */
/* ------------------------------------------------------------------ */

export interface CapitalPlan {
  min_amount: Naira
  /** Above this amount the customer must contact the investment team. */
  max_self_serve_amount: Naira
  tenures: TenureOption[]
  checkout_mode: CheckoutMode
  pricing_examples: Naira[]
}

export interface CapitalQuote {
  amount: Naira
  tenure_months: number
  roi_percent: number
  projected_return: Naira
  profit: Naira
  maturity_date: ISODate
}

export interface CapitalInterestPayload extends ContactDetails {
  amount: Naira
  tenure_months: number
}

export interface CreateCapitalInvestmentPayload {
  amount: Naira
  tenure_months: number
}

export interface CapitalInvestmentOrder {
  id: number
  reference: string
  status: OrderStatus
  quote: CapitalQuote
  agreement_signed_at: ISODateTime | null
  created_at: ISODateTime
}

/* ------------------------------------------------------------------ */
/* Agreements                                                          */
/* ------------------------------------------------------------------ */

export type AgreementSubject = 'buyback_order' | 'capital_investment'

export interface Agreement {
  id: number
  title: string
  /** Short-lived signed URL to the PDF, served by Laravel. */
  document_url: string
  page_count: number
  /** Plain-text preview of the first clauses, rendered while the PDF loads. */
  preview_paragraphs: string[]
  signed_at: ISODateTime | null
}

export interface SignAgreementPayload {
  accepted: true
  /** Present when the customer opts for a typed digital signature. */
  typed_signature_name?: string | null
}

/* ------------------------------------------------------------------ */
/* Portfolio (dashboard)                                               */
/* ------------------------------------------------------------------ */

export type PositionStatus = 'pending' | 'active' | 'matured' | 'paid_out' | 'cancelled'

export interface PortfolioSummary {
  total_invested: Naira
  active_positions: number
  projected_profit: Naira
  average_roi_percent: number
  total_expected_payout: Naira
  next_maturity_date: ISODate | null
  days_to_next_maturity: number | null
}

interface PositionBase {
  id: number
  reference: string
  status: PositionStatus
  principal: Naira
  roi_percent: number
  projected_return: Naira
  total_payout: Naira
  started_at: ISODate
  maturity_date: ISODate
  tenure_months: number
  months_elapsed: number
  days_to_maturity: number
  documents: DocumentFile[]
  can_request_payout: boolean
  can_reinvest: boolean
}

export interface CapitalPosition extends PositionBase {
  plan_name: string
}

export interface BuybackPosition extends PositionBase {
  estate: Pick<EstateSummary, 'id' | 'slug' | 'name' | 'location'>
  plot_codes: string[]
  size_sqm: number
}

export interface PortfolioOverview<P> {
  summary: PortfolioSummary
  positions: P[]
}
