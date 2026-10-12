import { del, get, getPaginated, post, put, upload } from '@/services/http/client'
import type {
  BookInspectionPayload,
  Inspection,
  InspectionAvailability,
  Listing,
  ListingDetailsPayload,
  ListingFee,
  ListQuery,
  MaintenanceRequest,
  MaintenanceRequestPayload,
  Media,
  PropertyApplication,
  PropertyApplicationPayload,
  PropertyDetail,
  PropertyFacets,
  PropertyHolding,
  PropertyHoldingDetail,
  PropertySummary,
  SubmitListingPayload,
} from '@/types'

/** Marketplace — /api/v1/properties/* — BACKEND_API_CONTRACT.md §8 */
export const propertyService = {
  list: (query: ListQuery = {}) => getPaginated<PropertySummary>('/properties', { params: query }),
  featured: () => get<PropertySummary[]>('/properties/featured'),
  facets: () => get<PropertyFacets>('/properties/facets'),
  detail: (slug: string) => get<PropertyDetail>(`/properties/${encodeURIComponent(slug)}`),
  similar: (slug: string) => get<PropertySummary[]>(`/properties/${encodeURIComponent(slug)}/similar`),

  apply: (slug: string, payload: PropertyApplicationPayload) =>
    post<PropertyApplication>(`/properties/${encodeURIComponent(slug)}/applications`, payload),

  inspectionAvailability: (slug: string) =>
    get<InspectionAvailability[]>(`/properties/${encodeURIComponent(slug)}/inspection-availability`),

  bookInspection: (slug: string, payload: BookInspectionPayload) =>
    post<Inspection>(`/properties/${encodeURIComponent(slug)}/inspections`, payload),
}

/** Owner listings — /api/v1/listings/* — BACKEND_API_CONTRACT.md §9 */
export const listingService = {
  fee: () => get<ListingFee>('/listings/fee'),
  mine: (query: ListQuery = {}) => getPaginated<Listing>('/me/listings', { params: query }),
  get: (id: number) => get<Listing>(`/me/listings/${id}`),
  create: (payload: ListingDetailsPayload) => post<Listing>('/listings', payload),
  update: (id: number, payload: ListingDetailsPayload) => put<Listing>(`/listings/${id}`, payload),

  uploadPhoto: (id: number, file: File, onProgress?: (p: number) => void) => {
    const form = new FormData()
    form.append('photo', file)
    return upload<Media>(`/listings/${id}/photos`, form, onProgress)
  },
  removePhoto: (id: number, mediaId: number) => del(`/listings/${id}/photos/${mediaId}`),

  /** Confirms accuracy; listing moves to `awaiting_payment`. Payment is initialised separately. */
  submit: (id: number, payload: SubmitListingPayload) => post<Listing>(`/listings/${id}/submit`, payload),
}

/** Purchases, leases and rentals — /api/v1/me/holdings/* — BACKEND_API_CONTRACT.md §10 */
export const holdingService = {
  list: (query: ListQuery = {}) => getPaginated<PropertyHolding>('/me/holdings', { params: query }),
  get: (id: number) => get<PropertyHoldingDetail>(`/me/holdings/${id}`),
  logMaintenance: (id: number, payload: MaintenanceRequestPayload) =>
    post<MaintenanceRequest>(`/me/holdings/${id}/maintenance-requests`, payload),
}
