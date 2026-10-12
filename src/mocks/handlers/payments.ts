import type {
  BuybackOrder,
  BuybackPosition,
  CapitalInvestmentOrder,
  CapitalPosition,
  PayableType,
  PaymentMethod,
  PaymentSummaryLine,
  PaymentVerification,
} from '@/types'
import { formatDate, formatDateUS, formatNaira, formatSignedNaira } from '@/utils/format'
import { db } from '../db'
import { created, fail, mock, ok, paginate, requireAuth, validate } from '../router'

type Owned<T> = T & { userId?: number }

interface Payable {
  amount: number
  title: string
  sections: PaymentSummaryLine[][]
  nextUrl: string
  onSuccess: () => void
}

function resolvePayable(type: PayableType, id: number, userId: number): Payable {
  if (type === 'capital_investment') {
    const order = db.state.capitalOrders.find((o) => o.id === id && (o as Owned<CapitalInvestmentOrder>).userId === userId)
    if (!order) fail(404, 'Investment not found.')
    if (!order.agreement_signed_at) fail(422, 'Sign the agreement before paying.', 'agreement_unsigned')
    const q = order.quote
    return {
      amount: q.amount,
      title: 'Capital investment',
      sections: [
        [{ label: 'Tenure', value: `${q.tenure_months} months` }],
        [
          { label: 'Investment amount', value: formatNaira(q.amount), emphasis: 'strong' },
          { label: 'Interest Rate', value: `${q.roi_percent}%` },
          { label: 'Projected return', value: formatNaira(q.projected_return) },
          { label: 'Profit', value: formatSignedNaira(q.profit), emphasis: 'positive' },
        ],
        [{ label: 'Maturity date', value: formatDate(q.maturity_date), emphasis: 'strong' }],
      ],
      nextUrl: '/dashboard/capital-investment',
      onSuccess: () => {
        order.status = 'active'
        const list = (db.state.capitalPositions[userId] ??= [])
        const position: CapitalPosition = {
          id: order.id,
          reference: order.reference,
          plan_name: `${q.tenure_months}-month plan`,
          status: 'active',
          principal: q.amount,
          roi_percent: q.roi_percent,
          projected_return: q.projected_return,
          total_payout: q.projected_return,
          started_at: new Date().toISOString().slice(0, 10),
          maturity_date: q.maturity_date,
          tenure_months: q.tenure_months,
          months_elapsed: 0,
          days_to_maturity: Math.round((new Date(q.maturity_date).getTime() - Date.now()) / 86_400_000),
          documents: [
            { id: db.nextId(), name: 'Payment receipt', type: 'payment_receipt', size_bytes: 180_000, uploaded_at: new Date().toISOString(), status: 'available' },
            { id: db.nextId(), name: 'Investment Contract', type: 'investment_contract', size_bytes: 812_000, uploaded_at: new Date().toISOString(), status: 'available' },
            { id: db.nextId(), name: 'Investment certificate', type: 'investment_certificate', size_bytes: 420_000, uploaded_at: new Date().toISOString(), status: 'available' },
          ],
          can_request_payout: false,
          can_reinvest: false,
        }
        list.unshift(position)
      },
    }
  }

  if (type === 'buyback_order') {
    const order = db.state.buybackOrders.find((o) => o.id === id && (o as Owned<BuybackOrder>).userId === userId)
    if (!order) fail(404, 'Order not found.')
    if (!order.agreement_signed_at) fail(422, 'Sign the agreement before paying.', 'agreement_unsigned')
    const q = order.quote
    return {
      amount: q.total_price,
      title: 'Buyback purchase',
      sections: [
        [
          { label: 'Estate', value: order.estate.name },
          { label: `Plots (${order.plots.length})`, value: order.plots.map((p) => `${p.code} · ${p.size_sqm} sqm`).join('\n') },
        ],
        [
          { label: 'Price', value: formatNaira(q.total_price), emphasis: 'strong' },
          { label: 'Tenure', value: `${q.tenure_months} months` },
          { label: 'Projected return', value: formatNaira(q.projected_return) },
          { label: 'Profit', value: formatSignedNaira(q.profit), emphasis: 'positive' },
        ],
        [{ label: 'Maturity date', value: formatDate(q.maturity_date), emphasis: 'strong' }],
      ],
      nextUrl: '/dashboard/buyback',
      onSuccess: () => {
        order.status = 'active'
        order.plots.forEach((p) => (db.state.plotStatus[p.id] = 'sold'))
        const position: BuybackPosition = {
          id: order.id,
          reference: order.reference,
          estate: order.estate,
          plot_codes: order.plots.map((p) => p.code),
          size_sqm: order.plots.reduce((s, p) => s + p.size_sqm, 0),
          status: 'active',
          principal: q.total_price,
          roi_percent: q.roi_percent,
          projected_return: q.projected_return,
          total_payout: q.projected_return,
          started_at: new Date().toISOString().slice(0, 10),
          maturity_date: q.maturity_date,
          tenure_months: q.tenure_months,
          months_elapsed: 0,
          days_to_maturity: Math.round((new Date(q.maturity_date).getTime() - Date.now()) / 86_400_000),
          documents: [
            { id: db.nextId(), name: 'Receipt of payment', type: 'payment_receipt', size_bytes: 180_000, uploaded_at: new Date().toISOString(), status: 'available' },
            { id: db.nextId(), name: 'Buy-back agreement', type: 'buyback_agreement', size_bytes: 640_000, uploaded_at: new Date().toISOString(), status: 'available' },
            { id: db.nextId(), name: 'Post-dated cheque', type: 'post_dated_cheque', size_bytes: null, uploaded_at: null, status: 'issued_after_signing' },
          ],
          can_request_payout: false,
          can_reinvest: false,
        }
        ;(db.state.buybackPositions[userId] ??= []).unshift(position)
      },
    }
  }

  if (type === 'listing_fee') {
    const listing = db.state.listings.find((l) => l.id === id)
    if (!listing) fail(404, 'Listing not found.')
    const fee = db.state.settings.fees.listing_fee
    return {
      amount: fee,
      title: 'Listing registration fee',
      sections: [[{ label: 'Listing', value: listing.title }, { label: 'Registration fee', value: formatNaira(fee), emphasis: 'strong' }]],
      nextUrl: `/dashboard/property-management/listings/${listing.id}`,
      onSuccess: () => {
        listing.status = 'pending_verification'
        listing.listed_at = new Date().toISOString().slice(0, 10)
      },
    }
  }

  const holding = db.holdings[userId]?.find((h) => h.id === id)
  if (!holding) fail(404, 'Holding not found.')
  return {
    amount: holding.rate ?? 0,
    title: holding.holding_type === 'rent' ? 'Rent payment' : 'Lease renewal',
    sections: [[{ label: 'Property', value: holding.property.title }, { label: 'Amount', value: formatNaira(holding.rate), emphasis: 'strong' }]],
    nextUrl: `/dashboard/property-management/holdings/${holding.id}`,
    onSuccess: () => {
      holding.payments.unshift({ id: db.nextId(), date: new Date().toISOString().slice(0, 10), description: 'Renewal', amount: holding.rate ?? 0, status: 'paid' })
    },
  }
}

mock.post('/payments/initialize', (ctx) => {
  const user = requireAuth(ctx)
  validate(ctx.body, { payable_type: ['required'], payable_id: ['required'], method: ['required'], callback_url: ['required'] })
  const payable = resolvePayable(ctx.body.payable_type as PayableType, Number(ctx.body.payable_id), user.id)
  const reference = `PAY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  const verification: PaymentVerification = {
    reference,
    status: 'pending',
    amount: payable.amount,
    currency: 'NGN',
    method: ctx.body.method as PaymentMethod,
    paid_at: null,
    gateway_response: null,
    payable_type: ctx.body.payable_type as PayableType,
    payable_id: Number(ctx.body.payable_id),
    summary: { title: payable.title, sections: payable.sections },
    next_url: payable.nextUrl,
  }
  db.state.payments[reference] = { reference, userId: user.id, callbackUrl: String(ctx.body.callback_url), verification }
  db.save()
  const checkout = new URL('/dev/paystack-checkout', window.location.origin)
  checkout.searchParams.set('reference', reference)
  checkout.searchParams.set('amount', String(payable.amount))
  checkout.searchParams.set('callback_url', String(ctx.body.callback_url))
  return created(
    { reference, authorization_url: checkout.toString(), access_code: `ac_${reference.toLowerCase()}`, amount: payable.amount, currency: 'NGN', expires_at: null },
    'Payment initialised.',
  )
})

/** Mock-only: simulates Paystack calling the Laravel webhook. */
mock.post('/__mock/payments/:reference/complete', ({ params, body }) => {
  const entry = db.state.payments[params.reference ?? '']
  if (!entry) fail(404, 'Unknown reference.')
  const outcome = body.outcome as 'success' | 'failed' | 'abandoned'
  if (entry.verification.status !== 'pending') return ok(entry.verification)
  entry.verification.status = outcome
  entry.verification.gateway_response = outcome === 'success' ? 'Approved' : outcome === 'failed' ? 'Declined by issuing bank' : 'Customer closed the checkout'
  if (outcome === 'success') {
    entry.verification.paid_at = new Date().toISOString()
    resolvePayable(entry.verification.payable_type, entry.verification.payable_id, entry.userId).onSuccess()
    const sections = entry.verification.summary.sections
    sections.splice(Math.max(sections.length - 1, 0), 0, [
      { label: 'Amount paid', value: formatNaira(entry.verification.amount) },
      { label: 'Payment date', value: formatDateUS(entry.verification.paid_at) },
    ])
  }
  db.save()
  return ok(entry.verification)
})

function verificationFor(reference: string, userId: number) {
  const entry = db.state.payments[reference]
  if (!entry || entry.userId !== userId) fail(404, 'We could not find a payment with this reference.', 'payment_not_found')
  return entry.verification
}

mock.get('/payments/:reference/verify', (ctx) => ok(verificationFor(ctx.params.reference ?? '', requireAuth(ctx).id)))
mock.get('/payments/:reference', (ctx) => ok(verificationFor(ctx.params.reference ?? '', requireAuth(ctx).id)))

mock.get('/me/transactions', (ctx) => {
  const user = requireAuth(ctx)
  return paginate(db.transactions.filter((t) => t.user?.id === user.id), ctx.query)
})
