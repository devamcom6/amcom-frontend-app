import type { ISODateTime } from './api'
import type { FaqItem, Testimonial } from './admin'
import type { Bank, IdType } from './profile'

export interface HomeContent {
  stats: { value: string; label: string }[]
  testimonials: Testimonial[]
}

export type FaqProduct = FaqItem['product']

export interface CmsPage {
  slug: string
  title: string
  /** Sanitised HTML authored in the admin CMS. Re-sanitised on the client before rendering. */
  body_html: string
  updated_at: ISODateTime
}

export interface ContactMessagePayload {
  full_name: string
  email: string
  phone?: string | null
  subject: string
  message: string
}

export interface StateWithLgas {
  name: string
  lgas: string[]
}

export interface Lookups {
  countries: string[]
  states: StateWithLgas[]
  id_types: { value: IdType; label: string }[]
  relationships: string[]
  banks: Bank[]
  property_locations: string[]
}
