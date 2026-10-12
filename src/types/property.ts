import type { ISODate, ISODateTime, Naira } from './api'
import type { DocumentFile, Media } from './media'

export type ListingType = 'sale' | 'rent' | 'lease'
export type PropertyType =
  | 'apartment'
  | 'duplex'
  | 'house'
  | 'land'
  | 'commercial'
  | 'office'
  | 'warehouse'
  | 'terrace'
  | 'real_estate'
  | 'other'
export type PropertyCondition = 'newly_built' | 'fairly_used' | 'renovated' | 'under_construction'
export type FurnishingStatus = 'furnished' | 'semi_furnished' | 'unfurnished'
export type PricePeriod = 'year' | 'month' | null

/* ------------------------------------------------------------------ */
/* Marketplace (public listings verified by Amcom)                     */
/* ------------------------------------------------------------------ */

export interface PropertySummary {
  id: number
  slug: string
  title: string
  address: string
  city: string
  state: string
  listing_type: ListingType
  property_type: PropertyType
  price: Naira
  price_period: PricePeriod
  bedrooms: number | null
  bathrooms: number | null
  size_sqm: number | null
  cover_image: Media
}

export interface PropertyDetail extends PropertySummary {
  description: string
  features: string[]
  gallery: Media[]
  latitude: number | null
  longitude: number | null
  location_label: string
  condition: PropertyCondition | null
  furnishing: FurnishingStatus | null
}

export interface PropertyFilters {
  search?: string
  location?: string[]
  listing_type?: ListingType[]
  property_type?: PropertyType[]
  min_price?: number | null
  max_price?: number | null
  bedrooms?: number | null
  sort?: 'newest' | 'price_asc' | 'price_desc'
}

export interface PropertyFacets {
  locations: string[]
  listing_types: ListingType[]
  property_types: PropertyType[]
  price_ranges: { label: string; min: number | null; max: number | null }[]
}

export interface PropertyApplicationPayload {
  full_name: string
  email: string
  phone: string
  message: string
}

export interface PropertyApplication {
  id: number
  reference: string
  property_title: string
  status: 'received' | 'under_review' | 'approved' | 'declined'
  created_at: ISODateTime
}

export type InspectionType = 'in_person' | 'virtual'
export type InspectionAttendee = 'self' | 'someone_else'

export interface InspectionAvailability {
  date: ISODate
  times: string[]
}

export interface BookInspectionPayload {
  type: InspectionType
  attendee: InspectionAttendee
  full_name: string
  email: string
  phone: string
  date: ISODate
  time: string
  message?: string | null
}

export interface Inspection {
  id: number
  reference: string
  property_title: string
  type: InspectionType
  scheduled_for: ISODateTime
  status: 'scheduled' | 'completed' | 'cancelled'
  /** Download link for an .ics file ("Add to Calendar"). */
  calendar_url: string
}

/* ------------------------------------------------------------------ */
/* Owner listings ("List your property")                               */
/* ------------------------------------------------------------------ */

export type ListingStatus =
  | 'draft'
  | 'awaiting_payment'
  | 'pending_verification'
  | 'verified'
  | 'published'
  | 'rejected'
  | 'sold'
  | 'rented'
  | 'archived'

export interface ListingDetailsPayload {
  title?: string | null
  listing_type: ListingType
  property_type: PropertyType
  state: string
  city: string
  address: string
  size_sqm: number | null
  bedrooms: number | null
  bathrooms: number | null
  asking_price: Naira
  condition: PropertyCondition
  furnishing: FurnishingStatus
  amenities: string[]
  description?: string | null
}

export interface ListingFinancialSummary {
  expected_sale_price: Naira
  service_fee_percent: number
  service_fee: Naira
  net_proceeds: Naira
  payment_status: 'pending_sale' | 'processing' | 'paid'
}

export interface ListingActivity {
  status_label: string
  listed_since: ISODate | null
  interested_parties: number
  completed_viewings: number
}

export interface Listing extends ListingDetailsPayload {
  id: number
  reference: string
  title: string
  status: ListingStatus
  photos: Media[]
  documents: DocumentFile[]
  listed_at: ISODate | null
  rejection_reason: string | null
  financial_summary: ListingFinancialSummary | null
  activity: ListingActivity | null
  created_at: ISODateTime
}

export interface ListingFee {
  amount: Naira
  currency: 'NGN'
  description: string
}

export interface SubmitListingPayload {
  confirm_accuracy: true
}

/* ------------------------------------------------------------------ */
/* Purchases, leases and rentals held by the user                      */
/* ------------------------------------------------------------------ */

export type HoldingType = 'outright_purchase' | 'lease' | 'rent'
export type HoldingStatus = 'active' | 'expiring' | 'expired' | 'transferred' | 'pending'

export interface HoldingPayment {
  id: number
  date: ISODate
  description: string
  amount: Naira
  status: 'paid' | 'pending' | 'failed'
}

export interface MaintenanceRequest {
  id: number
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'resolved'
  created_at: ISODate
}

export interface PropertyHolding {
  id: number
  holding_type: HoldingType
  status: HoldingStatus
  status_label: string
  property: {
    id: number
    title: string
    address: string
    size_sqm: number | null
    cover_image: Media | null
  }
  /** Outright purchase */
  purchase_price: Naira | null
  acquired_on: ISODate | null
  title_document: string | null
  ownership_status: string | null
  /** Lease / rent */
  rate: Naira | null
  rate_period: PricePeriod
  period_start: ISODate | null
  period_end: ISODate | null
  renewal_date: ISODate | null
  next_payment_date: ISODate | null
  term_label: string | null
}

export interface PropertyHoldingDetail extends PropertyHolding {
  documents: DocumentFile[]
  payments: HoldingPayment[]
  maintenance_requests: MaintenanceRequest[]
}

export interface MaintenanceRequestPayload {
  title: string
  description: string
}
