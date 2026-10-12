import type { BuybackPosition, CapitalPosition, DocumentFile, PropertyHoldingDetail } from '@/types'
import { mockMedia } from '../media'

let docId = 500
const doc = (name: string, type: DocumentFile['type'], status: DocumentFile['status'] = 'available', size = 240_000): DocumentFile => ({
  id: ++docId,
  name,
  type,
  size_bytes: status === 'available' || status === 'pending_review' ? size : null,
  uploaded_at: status === 'available' || status === 'pending_review' ? '2026-02-03T10:00:00Z' : null,
  status,
})

export function seedCapitalPositions(): CapitalPosition[] {
  return [
    {
      id: 1,
      reference: 'CI-2026-00041',
      plan_name: '12-month plan',
      status: 'active',
      principal: 8_500_000,
      roi_percent: 27,
      projected_return: 10_795_000,
      total_payout: 10_795_000,
      started_at: '2026-02-03',
      maturity_date: '2027-02-03',
      tenure_months: 12,
      months_elapsed: 8,
      days_to_maturity: 114,
      documents: [
        doc('Payment receipt', 'payment_receipt'),
        doc('Investment Contract', 'investment_contract', 'available', 812_000),
        doc('Investment certificate', 'investment_certificate', 'available', 420_000),
      ],
      can_request_payout: false,
      can_reinvest: false,
    },
  ]
}

export function seedBuybackPositions(): BuybackPosition[] {
  return [
    {
      id: 1,
      reference: 'BB-2026-00112',
      estate: {
        id: 1,
        slug: 'green-lush-estate',
        name: 'Green Lush Estate',
        location: { address: 'Abara Etche', city: 'Etche', state: 'Rivers State', latitude: null, longitude: null },
      },
      plot_codes: ['G092'],
      size_sqm: 600,
      status: 'active',
      principal: 5_000_000,
      roi_percent: 42,
      projected_return: 7_100_000,
      total_payout: 7_100_000,
      started_at: '2026-07-06',
      maturity_date: '2028-07-06',
      tenure_months: 24,
      months_elapsed: 3,
      days_to_maturity: 633,
      documents: [
        doc('Receipt of payment', 'payment_receipt'),
        doc('Buy-back agreement', 'buyback_agreement', 'not_signed'),
        doc('Post-dated cheque', 'post_dated_cheque', 'issued_after_signing'),
      ],
      can_request_payout: false,
      can_reinvest: false,
    },
    {
      id: 2,
      reference: 'BB-2025-00067',
      estate: {
        id: 3,
        slug: 'estate-de-villa',
        name: 'Estate De Villa',
        location: { address: 'Eleme', city: 'Eleme', state: 'Rivers State', latitude: null, longitude: null },
      },
      plot_codes: ['E084', 'E085'],
      size_sqm: 600,
      status: 'matured',
      principal: 6_400_000,
      roi_percent: 15,
      projected_return: 7_360_000,
      total_payout: 7_360_000,
      started_at: '2025-09-01',
      maturity_date: '2026-09-01',
      tenure_months: 12,
      months_elapsed: 12,
      days_to_maturity: 0,
      documents: [
        doc('Receipt of payment', 'payment_receipt'),
        doc('Buy-back agreement', 'buyback_agreement'),
        doc('Post-dated cheque', 'post_dated_cheque'),
      ],
      can_request_payout: true,
      can_reinvest: true,
    },
  ]
}

export function seedHoldings(): PropertyHoldingDetail[] {
  return [
    {
      id: 1,
      holding_type: 'lease',
      status: 'active',
      status_label: 'Active Lease',
      property: {
        id: 8,
        title: 'Oakwood Residences, Apt 4B',
        address: 'Trans-Amadi, Port Harcourt',
        size_sqm: 120,
        cover_image: mockMedia('property-building', 'Oakwood Residences exterior'),
      },
      purchase_price: null,
      acquired_on: '2023-03-22',
      title_document: null,
      ownership_status: null,
      rate: 1_800_000,
      rate_period: 'year',
      period_start: '2025-11-15',
      period_end: '2026-11-14',
      renewal_date: '2026-10-14',
      next_payment_date: '2026-11-15',
      term_label: '2 Years',
      documents: [doc('Lease Agreement (PDF)', 'lease_agreement'), doc('Payment Receipt — Year 1', 'payment_receipt')],
      payments: [
        { id: 1, date: '2025-11-15', description: 'Renewal', amount: 1_800_000, status: 'paid' },
        { id: 2, date: '2024-11-15', description: 'Renewal', amount: 1_800_000, status: 'paid' },
      ],
      maintenance_requests: [
        { id: 1, title: 'AC not cooling in master bedroom', description: null, status: 'pending', created_at: '2025-11-15' },
        { id: 2, title: 'Leaking kitchen tap', description: null, status: 'resolved', created_at: '2024-11-15' },
      ],
    },
    {
      id: 2,
      holding_type: 'outright_purchase',
      status: 'transferred',
      status_label: 'Outright Purchase',
      property: {
        id: 99,
        title: 'Pine Crest Estate – Plot 12A (Full Plot / 500 SQM)',
        address: 'Trans-Amadi, Port Harcourt',
        size_sqm: 500,
        cover_image: mockMedia('estate-greenlush', 'Pine Crest Estate plot'),
      },
      purchase_price: 12_500_000,
      acquired_on: '2025-06-12',
      title_document: 'Registered Deed & Survey Plan',
      ownership_status: 'Fully Transferred',
      rate: null,
      rate_period: null,
      period_start: null,
      period_end: null,
      renewal_date: null,
      next_payment_date: null,
      term_label: null,
      documents: [doc('Title Deed (PDF)', 'title_deed'), doc('Survey plan', 'survey_plan'), doc('Deed of Conveyance', 'deed_of_conveyance')],
      payments: [{ id: 3, date: '2025-06-12', description: 'Purchase payment', amount: 12_500_000, status: 'paid' }],
      maintenance_requests: [],
    },
    {
      id: 3,
      holding_type: 'rent',
      status: 'active',
      status_label: 'Active Rent',
      property: {
        id: 11,
        title: 'Amara Heights, Unit 3C',
        address: 'Trans-Amadi, Port Harcourt',
        size_sqm: 160,
        cover_image: mockMedia('property-apartments', 'Amara Heights exterior'),
      },
      purchase_price: null,
      acquired_on: '2025-01-01',
      title_document: null,
      ownership_status: null,
      rate: 250_000,
      rate_period: 'month',
      period_start: '2025-01-01',
      period_end: '2025-12-31',
      renewal_date: '2025-12-01',
      next_payment_date: '2026-11-01',
      term_label: '1 Year',
      documents: [doc('Tenancy Agreement', 'tenancy_agreement')],
      payments: [{ id: 4, date: '2026-10-01', description: 'Monthly rent', amount: 250_000, status: 'paid' }],
      maintenance_requests: [],
    },
  ]
}

export function listingDocuments(): DocumentFile[] {
  return [
    doc('Property Photos', 'property_photos', 'available', 12_400_000),
    doc('Title Documents', 'title_documents', 'pending_review', 4_100_000),
    doc('Proof of Ownership', 'proof_of_ownership', 'pending_review', 840_000),
  ]
}
