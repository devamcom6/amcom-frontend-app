import { get, getPaginated, post } from '@/services/http/client'
import type { InitializePaymentPayload, ListQuery, PaymentInitialization, PaymentVerification, Transaction } from '@/types'

/**
 * Paystack integration — /api/v1/payments/* — BACKEND_API_CONTRACT.md §11
 *
 * The frontend never sees the Paystack secret key and never decides that a payment
 * succeeded. Laravel initialises the transaction and later verifies it (webhook +
 * server-side verify call). The callback page only *asks* Laravel for the verified state.
 */
export const paymentService = {
  initialize: (payload: InitializePaymentPayload) => post<PaymentInitialization>('/payments/initialize', payload),

  verify: (reference: string) => get<PaymentVerification>(`/payments/${encodeURIComponent(reference)}/verify`),

  get: (reference: string) => get<PaymentVerification>(`/payments/${encodeURIComponent(reference)}`),

  history: (query: ListQuery = {}) => getPaginated<Transaction>('/me/transactions', { params: query }),
}
