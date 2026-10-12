import { get, post } from '@/services/http/client'
import type { CmsPage, ContactMessagePayload, FaqItem, FaqProduct, HomeContent, Lookups } from '@/types'

/** /api/v1/content/*, /api/v1/lookups, /api/v1/contact — BACKEND_API_CONTRACT.md §13 */
export const contentService = {
  home: () => get<HomeContent>('/content/home'),
  faqs: (product: FaqProduct) => get<FaqItem[]>('/content/faqs', { params: { product } }),
  page: (slug: string) => get<CmsPage>(`/content/pages/${encodeURIComponent(slug)}`),
  lookups: () => get<Lookups>('/lookups'),
  contact: (payload: ContactMessagePayload) => post<{ reference: string }>('/contact', payload),
}
