import { get, post } from '@/services/http/client'
import type {
  Agreement,
  CapitalInterestPayload,
  CapitalInvestmentOrder,
  CapitalPlan,
  CapitalPosition,
  CreateCapitalInvestmentPayload,
  InterestSubmission,
  PortfolioOverview,
  SignAgreementPayload,
} from '@/types'

/** /api/v1/capital/* — see BACKEND_API_CONTRACT.md §7 */
export const capitalService = {
  plan: () => get<CapitalPlan>('/capital/plan'),

  submitInterest: (payload: CapitalInterestPayload) => post<InterestSubmission>('/capital/interests', payload),

  createInvestment: (payload: CreateCapitalInvestmentPayload) =>
    post<CapitalInvestmentOrder>('/capital/investments', payload),

  investment: (id: number) => get<CapitalInvestmentOrder>(`/capital/investments/${id}`),

  agreement: (id: number) => get<Agreement>(`/capital/investments/${id}/agreement`),

  signAgreement: (id: number, payload: SignAgreementPayload) =>
    post<CapitalInvestmentOrder>(`/capital/investments/${id}/agreement/sign`, payload),

  /* Dashboard */
  portfolio: () => get<PortfolioOverview<CapitalPosition>>('/me/capital'),
  position: (id: number) => get<CapitalPosition>(`/me/capital/positions/${id}`),
  requestPayout: (id: number) => post<CapitalPosition>(`/me/capital/positions/${id}/payout-request`),
  reinvest: (id: number, tenureMonths: number) =>
    post<CapitalPosition>(`/me/capital/positions/${id}/reinvest`, { tenure_months: tenureMonths }),
}
