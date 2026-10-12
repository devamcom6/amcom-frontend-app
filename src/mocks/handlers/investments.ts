import type {
  Agreement,
  BuybackOrder,
  BuybackQuote,
  CapitalInvestmentOrder,
  CapitalPlan,
  CapitalQuote,
  InterestSubmission,
  PortfolioSummary,
} from '@/types'
import { addMonths, toISODate } from '@/utils/format'
import { db } from '../db'
import { arrayParam, created, fail, mock, ok, paginate, requireAuth, textMatch, validate, validationFail } from '../router'

/* ------------------------------------------------------------------ */
/* Estates & plots                                                     */
/* ------------------------------------------------------------------ */

mock.get('/estates', ({ query }) => {
  const items = db.estates
    .filter((e) => textMatch([e.name, e.location.city, e.location.state], query.search))
    .map(({ description: _d, gallery: _g, tenures: _t, checkout_mode: _c, max_plots_per_order: _m, ...summary }) => ({
      ...summary,
      available_plots: db.plotsFor(summary.id).filter((p) => p.status === 'available').length,
    }))
  return paginate(items, { per_page: 3, ...query })
})

mock.get('/estates/:slug', ({ params }) => {
  const estate = db.estates.find((e) => e.slug === params.slug)
  if (!estate) fail(404, 'Estate not found.', 'not_found')
  return ok({ ...estate, available_plots: db.plotsFor(estate.id).filter((p) => p.status === 'available').length })
})

mock.get('/estates/:slug/plots', ({ params, query }) => {
  const estate = db.estates.find((e) => e.slug === params.slug)
  if (!estate) fail(404, 'Estate not found.', 'not_found')
  const status = arrayParam(query, 'status')
  return ok(db.plotsFor(estate.id).filter((p) => !status.length || status.includes(p.status)))
})

function buybackQuote(estateId: number, plotIds: number[], tenureMonths: number): BuybackQuote {
  const estate = db.estates.find((e) => e.id === estateId)
  if (!estate) fail(404, 'Estate not found.')
  const tenure = estate.tenures.find((t) => t.months === tenureMonths)
  if (!tenure) validationFail({ tenure_months: ['The selected tenure is not available for this estate.'] })
  const plots = db.plotsFor(estate.id).filter((p) => plotIds.includes(p.id))
  if (plots.length !== plotIds.length || !plots.length) validationFail({ plot_ids: ['Select at least one valid plot.'] })
  const unavailable = plots.filter((p) => p.status !== 'available')
  if (unavailable.length) {
    fail(409, `Plot ${unavailable.map((p) => p.code).join(', ')} is no longer available. Please choose another.`, 'plot_unavailable')
  }
  if (plots.length > estate.max_plots_per_order) {
    validationFail({ plot_ids: [`You can select up to ${estate.max_plots_per_order} plots per order.`] })
  }
  const total = plots.reduce((s, p) => s + p.price, 0)
  const projected = Math.round(total * (1 + tenure.roi_percent / 100))
  return {
    plot_count: plots.length,
    total_price: total,
    tenure_months: tenure.months,
    roi_percent: tenure.roi_percent,
    projected_return: projected,
    profit: projected - total,
    maturity_date: toISODate(addMonths(new Date(), tenure.months)),
  }
}

mock.post('/buyback/interests', ({ body }) => {
  validate(body, { estate_id: ['required'], plot_ids: ['required'], tenure_months: ['required'], full_name: ['required'], email: ['required', 'email'], phone: ['required'] })
  buybackQuote(Number(body.estate_id), (body.plot_ids as number[]).map(Number), Number(body.tenure_months))
  const submission: InterestSubmission = {
    id: db.nextId(),
    reference: `INT-${db.state.seq}`,
    product: 'buyback',
    status: 'received',
    created_at: new Date().toISOString(),
  }
  return created(submission, 'Interest submitted successfully. An agent will contact you within 24–48 hours.')
})

mock.post('/buyback/orders', (ctx) => {
  const user = requireAuth(ctx)
  if (!user.email_verified_at) fail(403, 'Verify your email address to continue.', 'email_unverified')
  validate(ctx.body, { estate_id: ['required'], plot_ids: ['required'], tenure_months: ['required'] })
  const estate = db.estates.find((e) => e.id === Number(ctx.body.estate_id))
  if (!estate) fail(404, 'Estate not found.')
  if (estate.checkout_mode !== 'direct') fail(422, 'This estate only accepts expressions of interest.', 'checkout_mode_interest')
  const plotIds = (ctx.body.plot_ids as number[]).map(Number)
  const quote = buybackQuote(estate.id, plotIds, Number(ctx.body.tenure_months))
  const plots = db.plotsFor(estate.id).filter((p) => plotIds.includes(p.id))
  plots.forEach((p) => (db.state.plotStatus[p.id] = 'reserved'))
  const order: BuybackOrder = {
    id: db.nextId(),
    reference: `BB-${new Date().getFullYear()}-${String(db.state.seq).padStart(5, '0')}`,
    status: 'pending_signature',
    estate: { id: estate.id, slug: estate.slug, name: estate.name, location: estate.location },
    plots: plots.map(({ id, code, size_sqm }) => ({ id, code, size_sqm })),
    quote,
    agreement_signed_at: null,
    created_at: new Date().toISOString(),
  }
  db.state.buybackOrders.push(order)
  ;(order as BuybackOrder & { userId: number }).userId = user.id
  db.save()
  return created(order, 'Plots reserved for 30 minutes. Review and sign your agreement to continue.')
})

const findBuybackOrder = (id: number, userId: number) => {
  const order = db.state.buybackOrders.find((o) => o.id === id && (o as BuybackOrder & { userId?: number }).userId === userId)
  if (!order) fail(404, 'Order not found.', 'not_found')
  return order
}

mock.get('/buyback/orders/:id', (ctx) => ok(findBuybackOrder(Number(ctx.params.id), requireAuth(ctx).id)))

function agreementFor(title: string, signedAt: string | null): Agreement {
  return {
    id: db.nextId(),
    title,
    document_url: '/mock-media/agreement-sample.pdf',
    page_count: 11,
    preview_paragraphs: [
      'This Agreement executed and signed on this day b/w HOUVINCITY Global Limited With its Head Office at Plot 12, Admiralty Way, Lekki Phase 1, Lagos, Nigeria (herein after referred to as "Promoter")',
      'AND',
      'The Customer who is registered on the Amcom Portal (hereinafter called as "Investor"), accept all terms and conditions set forth herein.',
      'Whereas the party of the First Part manages real estate development and capital growth funds, delivering guaranteed yield rates at maturity, this binding agreement details the security and disbursement timelines.',
      '1. Investment Amount. The Investor shall pay the investment amount stated in the summary schedule in a single payment through the Promoter’s approved payment gateway.',
      '2. Tenure and Return. The return percentage is fixed at the point of signing and is not subject to market fluctuation for the duration of the tenure.',
      '3. Disbursement. At maturity the Promoter shall pay the principal and the agreed return into the Investor’s designated bank account within five (5) business days.',
    ],
    signed_at: signedAt,
  }
}

mock.get('/buyback/orders/:id/agreement', (ctx) => {
  const order = findBuybackOrder(Number(ctx.params.id), requireAuth(ctx).id)
  return ok(agreementFor('Buy-Back Agreement', order.agreement_signed_at))
})

mock.post('/buyback/orders/:id/agreement/sign', (ctx) => {
  const order = findBuybackOrder(Number(ctx.params.id), requireAuth(ctx).id)
  if (ctx.body.accepted !== true) validationFail({ accepted: ['You must accept the agreement to continue.'] })
  order.agreement_signed_at = new Date().toISOString()
  order.status = 'pending_payment'
  db.save()
  return ok(order, 'Agreement signed.')
})

/* ------------------------------------------------------------------ */
/* Capital investment                                                  */
/* ------------------------------------------------------------------ */

mock.get('/capital/plan', () => {
  const s = db.state.settings.capital_investment
  const plan: CapitalPlan = {
    min_amount: s.min_amount,
    max_self_serve_amount: s.max_self_serve_amount,
    tenures: s.tenures,
    checkout_mode: s.checkout_mode,
    pricing_examples: [1_000_000, 2_000_000, 5_000_000, 10_000_000, 20_000_000],
  }
  return ok(plan)
})

function capitalQuote(amount: number, tenureMonths: number): CapitalQuote {
  const s = db.state.settings.capital_investment
  if (!Number.isFinite(amount) || amount < s.min_amount) {
    validationFail({ amount: [`The minimum investment amount is ₦${s.min_amount.toLocaleString('en-NG')}.`] })
  }
  if (amount > s.max_self_serve_amount) {
    validationFail({ amount: [`For investments above ₦${s.max_self_serve_amount.toLocaleString('en-NG')}, contact our investment team directly.`] })
  }
  const tenure = s.tenures.find((t) => t.months === tenureMonths)
  if (!tenure) validationFail({ tenure_months: ['Choose a valid tenure.'] })
  const projected = Math.round(amount * (1 + tenure.roi_percent / 100))
  return {
    amount,
    tenure_months: tenure.months,
    roi_percent: tenure.roi_percent,
    projected_return: projected,
    profit: projected - amount,
    maturity_date: toISODate(addMonths(new Date(), tenure.months)),
  }
}

mock.post('/capital/interests', ({ body }) => {
  validate(body, { amount: ['required', 'numeric'], tenure_months: ['required'], full_name: ['required'], email: ['required', 'email'], phone: ['required'] })
  capitalQuote(Number(body.amount), Number(body.tenure_months))
  return created(
    { id: db.nextId(), reference: `INT-${db.state.seq}`, product: 'capital_investment', status: 'received', created_at: new Date().toISOString() } satisfies InterestSubmission,
    'Interest submitted successfully.',
  )
})

mock.post('/capital/investments', (ctx) => {
  const user = requireAuth(ctx)
  validate(ctx.body, { amount: ['required', 'numeric'], tenure_months: ['required'] })
  const quote = capitalQuote(Number(ctx.body.amount), Number(ctx.body.tenure_months))
  const order: CapitalInvestmentOrder & { userId: number } = {
    id: db.nextId(),
    reference: `CI-${new Date().getFullYear()}-${String(db.state.seq).padStart(5, '0')}`,
    status: 'pending_signature',
    quote,
    agreement_signed_at: null,
    created_at: new Date().toISOString(),
    userId: user.id,
  }
  db.state.capitalOrders.push(order)
  db.save()
  return created(order, 'Investment created. Review and sign your agreement to continue.')
})

const findCapitalOrder = (id: number, userId: number) => {
  const order = db.state.capitalOrders.find((o) => o.id === id && (o as CapitalInvestmentOrder & { userId?: number }).userId === userId)
  if (!order) fail(404, 'Investment not found.', 'not_found')
  return order
}

mock.get('/capital/investments/:id', (ctx) => ok(findCapitalOrder(Number(ctx.params.id), requireAuth(ctx).id)))

mock.get('/capital/investments/:id/agreement', (ctx) => {
  const order = findCapitalOrder(Number(ctx.params.id), requireAuth(ctx).id)
  return ok(agreementFor('Capital Investment Agreement', order.agreement_signed_at))
})

mock.post('/capital/investments/:id/agreement/sign', (ctx) => {
  const order = findCapitalOrder(Number(ctx.params.id), requireAuth(ctx).id)
  if (ctx.body.accepted !== true) validationFail({ accepted: ['You must accept the agreement to continue.'] })
  order.agreement_signed_at = new Date().toISOString()
  order.status = 'pending_payment'
  db.save()
  return ok(order, 'Agreement signed.')
})

/* ------------------------------------------------------------------ */
/* Portfolio                                                           */
/* ------------------------------------------------------------------ */

function summarise(positions: { principal: number; projected_return: number; roi_percent: number; maturity_date: string; days_to_maturity: number; status: string }[]): PortfolioSummary {
  const active = positions.filter((p) => p.status === 'active' || p.status === 'matured')
  const invested = active.reduce((s, p) => s + p.principal, 0)
  const payout = active.reduce((s, p) => s + p.projected_return, 0)
  const next = [...active].filter((p) => p.days_to_maturity > 0).sort((a, b) => a.days_to_maturity - b.days_to_maturity)[0]
  return {
    total_invested: invested,
    active_positions: active.length,
    projected_profit: payout - invested,
    average_roi_percent: active.length ? Math.round(active.reduce((s, p) => s + p.roi_percent, 0) / active.length) : 0,
    total_expected_payout: payout,
    next_maturity_date: next?.maturity_date ?? null,
    days_to_next_maturity: next?.days_to_maturity ?? null,
  }
}

mock.get('/me/capital', (ctx) => {
  const positions = db.state.capitalPositions[requireAuth(ctx).id] ?? []
  return ok({ summary: summarise(positions), positions })
})

mock.get('/me/capital/positions/:id', (ctx) => {
  const p = (db.state.capitalPositions[requireAuth(ctx).id] ?? []).find((x) => x.id === Number(ctx.params.id))
  if (!p) fail(404, 'Investment not found.', 'not_found')
  return ok(p)
})

mock.post('/me/capital/positions/:id/payout-request', (ctx) => {
  const p = (db.state.capitalPositions[requireAuth(ctx).id] ?? []).find((x) => x.id === Number(ctx.params.id))
  if (!p) fail(404, 'Investment not found.')
  if (!p.can_request_payout) fail(422, 'Payouts can be requested once the investment matures.', 'not_matured')
  return ok(p, 'Payout requested.')
})

mock.get('/me/buyback', (ctx) => {
  const positions = db.state.buybackPositions[requireAuth(ctx).id] ?? []
  return ok({ summary: summarise(positions), positions })
})

mock.get('/me/buyback/positions/:id', (ctx) => {
  const p = (db.state.buybackPositions[requireAuth(ctx).id] ?? []).find((x) => x.id === Number(ctx.params.id))
  if (!p) fail(404, 'Position not found.', 'not_found')
  return ok(p)
})
