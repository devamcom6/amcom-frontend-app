import { get, getPaginated, post } from '@/services/http/client'
import type {
  Agreement,
  BuybackInterestPayload,
  BuybackOrder,
  BuybackPosition,
  CreateBuybackOrderPayload,
  Estate,
  EstateSummary,
  InterestSubmission,
  ListQuery,
  Plot,
  PlotStatus,
  PortfolioOverview,
  SignAgreementPayload,
} from '@/types'

/** /api/v1/estates/*, /api/v1/buyback/* — see BACKEND_API_CONTRACT.md §6 */
export const buybackService = {
  estates: (query: ListQuery = {}) => getPaginated<EstateSummary>('/estates', { params: query }),

  estate: (slug: string) => get<Estate>(`/estates/${encodeURIComponent(slug)}`),

  plots: (slug: string, status?: PlotStatus) =>
    get<Plot[]>(`/estates/${encodeURIComponent(slug)}/plots`, { params: status ? { status } : undefined }),

  /** Public lead capture used when `estate.checkout_mode === 'interest'`. */
  submitInterest: (payload: BuybackInterestPayload) => post<InterestSubmission>('/buyback/interests', payload),

  /** Authenticated direct purchase (`checkout_mode === 'direct'`). Reserves the plots. */
  createOrder: (payload: CreateBuybackOrderPayload) => post<BuybackOrder>('/buyback/orders', payload),

  order: (id: number) => get<BuybackOrder>(`/buyback/orders/${id}`),

  agreement: (orderId: number) => get<Agreement>(`/buyback/orders/${orderId}/agreement`),

  signAgreement: (orderId: number, payload: SignAgreementPayload) =>
    post<BuybackOrder>(`/buyback/orders/${orderId}/agreement/sign`, payload),

  /* Dashboard */
  portfolio: () => get<PortfolioOverview<BuybackPosition>>('/me/buyback'),
  position: (id: number) => get<BuybackPosition>(`/me/buyback/positions/${id}`),
}
