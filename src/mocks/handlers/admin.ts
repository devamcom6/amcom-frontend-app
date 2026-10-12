import type { AdminAccount, DashboardStats, FaqItem, Permission, Report, ReportType, Role } from '@/types'
import { db } from '../db'
import { mockMedia } from '../media'
import { arrayParam, created, fail, mock, ok, paginate, requirePermission, textMatch, validate, validationFail } from '../router'

function sortBy<T>(items: T[], sort: unknown): T[] {
  if (!sort || typeof sort !== 'string') return items
  const desc = sort.startsWith('-')
  const key = (desc ? sort.slice(1) : sort) as keyof T
  return [...items].sort((a, b) => {
    const av = a[key] as unknown as string | number
    const bv = b[key] as unknown as string | number
    if (av === bv) return 0
    return (av > bv ? 1 : -1) * (desc ? -1 : 1)
  })
}

const inRange = (iso: string | null, from?: unknown, to?: unknown) => {
  if (!iso) return true
  const d = iso.slice(0, 10)
  return (!from || d >= String(from)) && (!to || d <= String(to))
}

/* Dashboard ---------------------------------------------------------- */

mock.get('/admin/dashboard', (ctx) => {
  requirePermission(ctx, 'dashboard.view')
  const from = String(ctx.query.from ?? '')
  const to = String(ctx.query.to ?? '')
  const tx = db.transactions.filter((t) => inRange(t.created_at, from, to))
  const success = tx.filter((t) => t.status === 'success')
  const revenue = success.reduce((s, t) => s + t.amount, 0)

  const fromDate = new Date(from || Date.now() - 29 * 86_400_000)
  const toDate = new Date(to || Date.now())
  const days = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000) + 1)
  const buckets = Math.min(12, days)
  const size = days / buckets
  const revenueSeries = Array.from({ length: buckets }, (_, i) => {
    const start = new Date(fromDate.getTime() + i * size * 86_400_000)
    const end = new Date(fromDate.getTime() + (i + 1) * size * 86_400_000)
    const value = success
      .filter((t) => {
        const d = new Date(t.created_at)
        return d >= start && d < end
      })
      .reduce((s, t) => s + t.amount, 0)
    return { label: start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), value }
  })
  const signupsSeries = revenueSeries.map((b, i) => ({ label: b.label, value: 8 + ((i * 7) % 13) + Math.round(b.value / 4_000_000) }))

  const stats: DashboardStats = {
    range: { from, to },
    summary: {
      total_users: 1250,
      active_users: 1103,
      total_transactions: tx.length,
      total_revenue: revenue,
      assets_under_management: 2_140_000_000,
      pending_listings: db.adminListings.filter((l) => l.status === 'pending_verification').length,
      open_requests: db.requests.filter((r) => r.status !== 'closed').length,
    },
    trends: { users: 8.4, revenue: 12.7, transactions: -3.2, assets_under_management: 4.1 },
    revenue_series: revenueSeries,
    signups_series: signupsSeries,
    status_distribution: [
      { key: 'active', label: 'Active', value: db.adminInvestments.filter((i) => i.status === 'active').length },
      { key: 'pending', label: 'Pending', value: db.adminInvestments.filter((i) => ['pending_signature', 'pending_payment', 'interest_submitted'].includes(i.status)).length },
      { key: 'matured', label: 'Matured', value: db.adminInvestments.filter((i) => i.status === 'matured').length },
      { key: 'paid_out', label: 'Paid out', value: db.adminInvestments.filter((i) => i.status === 'paid_out').length },
    ],
    transaction_summary: (['success', 'pending', 'failed', 'abandoned'] as const).map((status) => ({
      status,
      count: tx.filter((t) => t.status === status).length,
      amount: tx.filter((t) => t.status === status).reduce((s, t) => s + t.amount, 0),
    })),
    recent_activity: [
      { id: 1, actor: 'Tunde Bakare', action: 'approved listing', subject: 'Amara Heights, Unit 3C', created_at: new Date(Date.now() - 18 * 60_000).toISOString() },
      { id: 2, actor: 'System', action: 'verified payment', subject: 'PAY-7K2D9QXA · ₦8,500,000', created_at: new Date(Date.now() - 52 * 60_000).toISOString() },
      { id: 3, actor: 'Ngozi Eze', action: 'invited admin', subject: 'amina@amcom.com', created_at: new Date(Date.now() - 3 * 3_600_000).toISOString() },
      { id: 4, actor: 'Kelechi Okafor', action: 'closed request', subject: 'REQ-4107 · Inspection', created_at: new Date(Date.now() - 6 * 3_600_000).toISOString() },
      { id: 5, actor: 'System', action: 'matured position', subject: 'BB-2025-00067', created_at: new Date(Date.now() - 26 * 3_600_000).toISOString() },
    ],
  }
  return ok(stats)
})

/* Users -------------------------------------------------------------- */

mock.get('/admin/users', (ctx) => {
  requirePermission(ctx, 'users.view')
  const q = ctx.query
  const status = arrayParam(q, 'status')
  const kyc = arrayParam(q, 'kyc_status')
  const items = db.adminUsers.filter(
    (u) => textMatch([u.name, u.email, u.phone], q.search) && (!status.length || status.includes(u.status)) && (!kyc.length || kyc.includes(u.kyc_status)),
  )
  return paginate(sortBy(items, q.sort ?? '-created_at'), q)
})

mock.get('/admin/users/:id', (ctx) => {
  requirePermission(ctx, 'users.view')
  const u = db.adminUsers.find((x) => x.id === Number(ctx.params.id))
  if (!u) fail(404, 'User not found.')
  return ok({
    ...u,
    address: '24 Ada George Road, Port Harcourt',
    next_of_kin: { full_name: 'Chinedu Okonkwo', relationship: 'Brother', phone: '+234 803 456 7890' },
    positions: db.adminInvestments.filter((i) => i.customer.id === u.id).map((i) => ({ reference: i.reference, product: i.product, principal: i.principal, status: i.status })),
    recent_transactions: db.transactions.filter((t) => t.user?.id === u.id).slice(0, 5).map((t) => ({ reference: t.reference, amount: t.amount, status: t.status, date: t.created_at.slice(0, 10) })),
  })
})

mock.patch('/admin/users/:id/status', (ctx) => {
  requirePermission(ctx, 'users.manage')
  const u = db.adminUsers.find((x) => x.id === Number(ctx.params.id))
  if (!u) fail(404, 'User not found.')
  validate(ctx.body, { status: ['required'] })
  u.status = ctx.body.status as never
  return ok(u, u.status === 'suspended' ? 'User suspended.' : 'User reactivated.')
})

mock.post('/admin/users/bulk', (ctx) => {
  requirePermission(ctx, 'users.manage')
  const ids = (ctx.body.ids as number[]) ?? []
  if (!ids.length) validationFail({ ids: ['Select at least one user.'] })
  const action = ctx.body.action
  let processed = 0
  for (const u of db.adminUsers) {
    if (!ids.includes(u.id)) continue
    if (action === 'suspend') u.status = 'suspended'
    if (action === 'activate') u.status = 'active'
    processed++
  }
  return ok({ processed, failed: ids.length - processed }, `${processed} user(s) updated.`)
})

/* Estates ------------------------------------------------------------ */

mock.get('/admin/estates', (ctx) => {
  requirePermission(ctx, 'estates.view')
  const items = db.estates.map((e) => {
    const plots = db.plotsFor(e.id)
    return {
      id: e.id,
      name: e.name,
      slug: e.slug,
      city: e.location.city,
      state: e.location.state,
      total_plots: plots.length,
      available_plots: plots.filter((p) => p.status === 'available').length,
      reserved_plots: plots.filter((p) => p.status === 'reserved').length,
      sold_plots: plots.filter((p) => p.status === 'sold').length,
      checkout_mode: e.checkout_mode,
      is_published: true,
    }
  })
  return paginate(items.filter((e) => textMatch([e.name, e.city], ctx.query.search)), ctx.query)
})

mock.patch('/admin/estates/:id', (ctx) => {
  requirePermission(ctx, 'estates.manage')
  return ok({ id: Number(ctx.params.id), is_published: ctx.body.is_published }, 'Estate updated.')
})

/* Listings ----------------------------------------------------------- */

mock.get('/admin/listings', (ctx) => {
  requirePermission(ctx, 'listings.view')
  const status = arrayParam(ctx.query, 'status')
  const type = arrayParam(ctx.query, 'listing_type')
  const items = db.adminListings.filter(
    (l) => textMatch([l.title, l.reference, l.owner.name, l.city], ctx.query.search) && (!status.length || status.includes(l.status)) && (!type.length || type.includes(l.listing_type)),
  )
  return paginate(sortBy(items, ctx.query.sort ?? '-submitted_at'), ctx.query)
})

mock.post('/admin/listings/:id/review', (ctx) => {
  requirePermission(ctx, 'listings.review')
  const l = db.adminListings.find((x) => x.id === Number(ctx.params.id))
  if (!l) fail(404, 'Listing not found.')
  if (l.status !== 'pending_verification') fail(409, 'Only listings pending verification can be reviewed.', 'invalid_state')
  if (ctx.body.decision === 'reject' && !ctx.body.reason) validationFail({ reason: ['Provide a reason so the owner can fix the listing.'] })
  l.status = ctx.body.decision === 'approve' ? 'published' : 'rejected'
  return ok(l, ctx.body.decision === 'approve' ? 'Listing approved and published. The owner has been emailed.' : 'Listing rejected. The owner has been emailed.')
})

/* Investments -------------------------------------------------------- */

mock.get('/admin/investments', (ctx) => {
  requirePermission(ctx, 'investments.view')
  const status = arrayParam(ctx.query, 'status')
  const product = arrayParam(ctx.query, 'product')
  const items = db.adminInvestments.filter(
    (i) =>
      textMatch([i.reference, i.customer.name, i.customer.email, i.description], ctx.query.search) &&
      (!status.length || status.includes(i.status)) &&
      (!product.length || product.includes(i.product)),
  )
  return paginate(sortBy(items, ctx.query.sort ?? '-created_at'), ctx.query)
})

mock.patch('/admin/investments/:id/status', (ctx) => {
  requirePermission(ctx, 'investments.manage')
  const i = db.adminInvestments.find((x) => x.id === Number(ctx.params.id))
  if (!i) fail(404, 'Investment not found.')
  i.status = ctx.body.status as never
  return ok(i, 'Investment updated.')
})

/* Transactions ------------------------------------------------------- */

mock.get('/admin/transactions', (ctx) => {
  requirePermission(ctx, 'transactions.view')
  const status = arrayParam(ctx.query, 'status')
  const type = arrayParam(ctx.query, 'payable_type')
  const items = db.transactions.filter(
    (t) =>
      textMatch([t.reference, t.user?.name, t.user?.email, t.description], ctx.query.search) &&
      (!status.length || status.includes(t.status)) &&
      (!type.length || type.includes(t.payable_type)) &&
      inRange(t.created_at, ctx.query.from, ctx.query.to),
  )
  return paginate(sortBy(items, ctx.query.sort ?? '-created_at'), ctx.query)
})

mock.post('/admin/transactions/:reference/requery', (ctx) => {
  requirePermission(ctx, 'transactions.manage')
  const t = db.transactions.find((x) => x.reference === ctx.params.reference)
  if (!t) fail(404, 'Transaction not found.')
  return ok(t, `Paystack reports this transaction as "${t.status}".`)
})

/* Requests ----------------------------------------------------------- */

mock.get('/admin/requests', (ctx) => {
  requirePermission(ctx, 'requests.view')
  const kind = arrayParam(ctx.query, 'kind')
  const status = arrayParam(ctx.query, 'status')
  const items = db.requests.filter(
    (r) => textMatch([r.reference, r.name, r.email, r.subject], ctx.query.search) && (!kind.length || kind.includes(r.kind)) && (!status.length || status.includes(r.status)),
  )
  return paginate(sortBy(items, ctx.query.sort ?? '-created_at'), ctx.query)
})

mock.patch('/admin/requests/:id', (ctx) => {
  const admin = requirePermission(ctx, 'requests.manage')
  const r = db.requests.find((x) => x.id === Number(ctx.params.id))
  if (!r) fail(404, 'Request not found.')
  if (ctx.body.status) r.status = ctx.body.status as never
  if (ctx.body.assigned_to_me) r.assigned_to = admin.name
  return ok(r, 'Request updated.')
})

/* Content ------------------------------------------------------------ */

mock.get('/admin/content/faqs', (ctx) => {
  requirePermission(ctx, 'content.manage')
  const product = arrayParam(ctx.query, 'product')
  return paginate(db.faqs.filter((f) => textMatch([f.question, f.answer], ctx.query.search) && (!product.length || product.includes(f.product))), ctx.query)
})

mock.post('/admin/content/faqs', (ctx) => {
  requirePermission(ctx, 'content.manage')
  validate(ctx.body, { product: ['required'], question: ['required', 'min:5'], answer: ['required', 'min:5'] })
  const faq: FaqItem = { id: db.nextId(), position: db.faqs.length + 1, is_published: true, ...(ctx.body as Pick<FaqItem, 'product' | 'question' | 'answer'>) }
  db.faqs.push(faq)
  return created(faq, 'FAQ created.')
})

mock.put('/admin/content/faqs/:id', (ctx) => {
  requirePermission(ctx, 'content.manage')
  const faq = db.faqs.find((f) => f.id === Number(ctx.params.id))
  if (!faq) fail(404, 'FAQ not found.')
  validate(ctx.body, { question: ['required', 'min:5'], answer: ['required', 'min:5'] })
  Object.assign(faq, ctx.body)
  return ok(faq, 'FAQ updated.')
})

mock.delete('/admin/content/faqs/:id', (ctx) => {
  requirePermission(ctx, 'content.manage')
  const i = db.faqs.findIndex((f) => f.id === Number(ctx.params.id))
  if (i >= 0) db.faqs.splice(i, 1)
  return ok(null, 'FAQ deleted.')
})

mock.get('/admin/content/testimonials', (ctx) => {
  requirePermission(ctx, 'content.manage')
  return paginate(db.homeContent.testimonials, ctx.query)
})

mock.patch('/admin/content/testimonials/:id', (ctx) => {
  requirePermission(ctx, 'content.manage')
  const t = db.homeContent.testimonials.find((x) => x.id === Number(ctx.params.id))
  if (!t) fail(404, 'Testimonial not found.')
  t.is_published = Boolean(ctx.body.is_published)
  return ok(t, t.is_published ? 'Testimonial published.' : 'Testimonial hidden.')
})

mock.get('/admin/media', (ctx) => {
  requirePermission(ctx, 'media.manage')
  const names = ['estate-greenlush-aerial', 'estate-greenlush', 'estate-ridgewood', 'estate-devilla', 'property-tower', 'property-living', 'property-lounge', 'property-terrace', 'property-bedroom', 'property-kitchen', 'property-bathroom', 'property-building', 'property-apartments', 'property-villa', 'property-mansion', 'property-estate-row']
  const items = names.map((n) => ({ ...mockMedia(n, n.replace(/-/g, ' ')), collection: n.startsWith('estate') ? 'estate_gallery' : 'property_gallery', size_bytes: 180_000 + n.length * 9000, created_at: new Date(Date.now() - n.length * 86_400_000).toISOString() }))
  const collection = arrayParam(ctx.query, 'collection')
  return paginate(items.filter((m) => !collection.length || collection.includes(String(m.collection))), { per_page: 12, ...ctx.query })
})

/* Reports ------------------------------------------------------------ */

mock.get('/admin/reports/:type', (ctx) => {
  requirePermission(ctx, 'reports.view')
  const type = ctx.params.type as ReportType
  const groupBy = (ctx.query.group_by as Report['group_by']) ?? 'month'
  const labels = groupBy === 'month' ? ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'] : groupBy === 'week' ? ['W36', 'W37', 'W38', 'W39', 'W40', 'W41'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const base: Record<ReportType, number> = { revenue: 48_000_000, investments: 34, users: 120, listings: 18 }
  const series = labels.map((label, i) => ({ label, value: Math.round(base[type] * (0.7 + ((i * 37) % 10) / 15)) }))
  const total = series.reduce((s, x) => s + x.value, 0)
  const isMoney = type === 'revenue'
  const report: Report = {
    type,
    range: { from: String(ctx.query.from ?? ''), to: String(ctx.query.to ?? '') },
    group_by: groupBy,
    totals: [
      { label: isMoney ? 'Total revenue' : `Total ${type}`, value: total, format: isMoney ? 'currency' : 'number' },
      { label: 'Average per period', value: Math.round(total / series.length), format: isMoney ? 'currency' : 'number' },
      { label: 'Change vs previous', value: 12.7, format: 'percent' },
    ],
    series,
    columns: [
      { key: 'period', label: 'Period' },
      { key: 'value', label: isMoney ? 'Revenue' : 'Count', format: isMoney ? 'currency' : 'number' },
      { key: 'share', label: 'Share of total' },
    ],
    rows: series.map((s) => ({ period: s.label, value: s.value, share: `${((s.value / total) * 100).toFixed(1)}%` })),
  }
  return ok(report)
})

mock.get('/admin/reports/:type/export', (ctx) => {
  requirePermission(ctx, 'reports.export')
  const csv = 'period,value\nMay,100\nJun,120\n'
  return { status: 200, data: new Blob([csv], { type: 'text/csv' }), headers: { 'content-type': 'text/csv' } }
})

/* Settings ----------------------------------------------------------- */

mock.get('/admin/settings', (ctx) => {
  requirePermission(ctx, 'settings.view')
  return ok(db.state.settings)
})

mock.put('/admin/settings', (ctx) => {
  requirePermission(ctx, 'settings.manage')
  const s = ctx.body as unknown as typeof db.state.settings
  if (!s?.fees || s.fees.listing_fee < 0) validationFail({ 'fees.listing_fee': ['Listing fee must be zero or more.'] })
  if (s.capital_investment.min_amount <= 0) validationFail({ 'capital_investment.min_amount': ['Minimum amount must be greater than zero.'] })
  db.state.settings = s
  db.save()
  return ok(s, 'Settings saved.')
})

/* Super admin -------------------------------------------------------- */

mock.get('/admin/admins', (ctx) => {
  requirePermission(ctx, 'admins.manage')
  return paginate(db.adminAccounts.filter((a) => textMatch([a.name, a.email], ctx.query.search)), ctx.query)
})

mock.post('/admin/admins', (ctx) => {
  requirePermission(ctx, 'admins.manage')
  validate(ctx.body, { name: ['required'], email: ['required', 'email'], role: ['required'] })
  if (db.adminAccounts.some((a) => a.email === ctx.body.email)) validationFail({ email: ['This email already belongs to an administrator.'] })
  const account: AdminAccount = {
    id: db.nextId(),
    name: String(ctx.body.name),
    email: String(ctx.body.email),
    role: ctx.body.role as Exclude<Role, 'user'>,
    status: 'invited',
    last_login_at: null,
    created_at: new Date().toISOString(),
  }
  db.adminAccounts.push(account)
  return created(account, 'Invitation sent.')
})

mock.patch('/admin/admins/:id', (ctx) => {
  const me = requirePermission(ctx, 'admins.manage')
  const a = db.adminAccounts.find((x) => x.id === Number(ctx.params.id))
  if (!a) fail(404, 'Administrator not found.')
  if (a.id === me.id) fail(422, 'You cannot change your own role.', 'self_modification')
  a.role = ctx.body.role as Exclude<Role, 'user'>
  return ok(a, 'Role updated.')
})

mock.delete('/admin/admins/:id', (ctx) => {
  const me = requirePermission(ctx, 'admins.manage')
  if (Number(ctx.params.id) === me.id) fail(422, 'You cannot revoke your own access.', 'self_modification')
  const i = db.adminAccounts.findIndex((x) => x.id === Number(ctx.params.id))
  if (i >= 0) db.adminAccounts.splice(i, 1)
  return ok(null, 'Administrator access revoked.')
})

mock.get('/admin/roles', (ctx) => {
  requirePermission(ctx, 'roles.manage')
  return ok(db.state.roles)
})

mock.get('/admin/permissions', async (ctx) => {
  requirePermission(ctx, 'roles.manage')
  const { PERMISSION_DEFINITIONS } = await import('../data/admin')
  return ok(PERMISSION_DEFINITIONS)
})

mock.put('/admin/roles/:id/permissions', (ctx) => {
  requirePermission(ctx, 'roles.manage')
  const role = db.state.roles.find((r) => r.id === Number(ctx.params.id))
  if (!role) fail(404, 'Role not found.')
  if (role.is_system) fail(422, 'System roles cannot be modified.', 'system_role')
  role.permissions = ctx.body.permissions as Permission[]
  // Revoked permissions take effect immediately for logged-in users of that role.
  db.state.users.filter((u) => u.role === role.name).forEach((u) => (u.permissions = [...role.permissions]))
  db.save()
  return ok(role, 'Permissions updated.')
})
