/**
 * Standard Laravel API envelope shared by every endpoint.
 * See docs/BACKEND_API_CONTRACT.md §2.
 */
export interface ApiSuccess<T> {
  success: true
  message: string
  data: T
}

export interface PaginationMeta {
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number | null
  to: number | null
}

export interface ApiPaginated<T> {
  success: true
  message: string
  data: T[]
  meta: PaginationMeta
}

export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}

export type ValidationErrors = Record<string, string[]>

export interface ApiErrorBody {
  success: false
  message: string
  /** Machine-readable error code, e.g. `invalid_credentials`, `email_unverified`, `token_expired`. */
  code?: string
  errors?: ValidationErrors
}

export type QueryValue = string | number | boolean | Array<string | number> | null | undefined

export interface ListQuery {
  page?: number
  per_page?: number
  search?: string
  sort?: string
  [key: string]: QueryValue
}

export type ISODate = string
export type ISODateTime = string
/** Monetary values are whole Naira. Conversion to kobo for Paystack happens only on the backend. */
export type Naira = number

export interface Option<T extends string | number = string> {
  value: T
  label: string
}
