import type { ISODateTime } from './api'

/**
 * Media object returned by Laravel after it has processed an upload through Cloudinary.
 * The frontend never talks to Cloudinary directly and never holds Cloudinary credentials.
 */
export interface Media {
  id: number
  url: string
  thumbnail_url: string
  width: number
  height: number
  format: string
  alt_text: string | null
  /** Width-keyed responsive variants, e.g. {"480": url, "960": url}, used to build srcset. */
  variants?: Record<string, string>
  /** Average colour shown as a placeholder while the image loads. */
  dominant_color?: string | null
  size_bytes?: number
  mime_type?: string
  collection?: MediaCollection
  created_at?: ISODateTime
}

export type MediaCollection =
  | 'avatar'
  | 'listing_photo'
  | 'property_gallery'
  | 'estate_gallery'
  | 'content'
  | 'document'

export interface UploadMediaPayload {
  file: File
  collection: MediaCollection
  alt_text?: string
}

export type DocumentType =
  | 'payment_receipt'
  | 'investment_contract'
  | 'investment_certificate'
  | 'buyback_agreement'
  | 'post_dated_cheque'
  | 'title_deed'
  | 'survey_plan'
  | 'deed_of_conveyance'
  | 'proof_of_ownership'
  | 'lease_agreement'
  | 'tenancy_agreement'
  | 'property_photos'
  | 'title_documents'
  | 'other'

export type DocumentStatus = 'available' | 'pending_review' | 'not_signed' | 'issued_after_signing'

export interface DocumentFile {
  id: number
  name: string
  type: DocumentType
  size_bytes: number | null
  uploaded_at: ISODateTime | null
  status: DocumentStatus
}

export interface SignedDownload {
  url: string
  filename: string
  expires_at: ISODateTime
}
