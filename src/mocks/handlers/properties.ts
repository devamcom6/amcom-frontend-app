import type { InspectionAvailability, Listing, ListingDetailsPayload, PropertyDetail, PropertySummary } from '@/types'
import { toISODate } from '@/utils/format'
import { db } from '../db'
import { mediaFromFile } from '../media'
import { arrayParam, created, fail, mock, ok, paginate, requireAuth, textMatch, validate, validationFail } from '../router'
import { listingDocuments } from '../data/portfolio'

function summary(p: PropertyDetail): PropertySummary {
  const { description: _d, features: _f, gallery: _g, latitude: _la, longitude: _lo, location_label: _l, condition: _c, furnishing: _fu, ...rest } = p
  return rest
}

mock.get('/properties', ({ query }) => {
  const locations = arrayParam(query, 'location')
  const listingTypes = arrayParam(query, 'listing_type')
  const propertyTypes = arrayParam(query, 'property_type')
  const min = query.min_price ? Number(query.min_price) : null
  const max = query.max_price ? Number(query.max_price) : null
  let items = db.properties.filter(
    (p) =>
      textMatch([p.title, p.address, p.city, p.state], query.search) &&
      (!locations.length || locations.some((l) => p.city === l || p.address.includes(l))) &&
      (!listingTypes.length || listingTypes.includes(p.listing_type)) &&
      (!propertyTypes.length || propertyTypes.includes(p.property_type)) &&
      (min === null || p.price >= min) &&
      (max === null || p.price <= max) &&
      (!query.bedrooms || (p.bedrooms ?? 0) >= Number(query.bedrooms)),
  )
  if (query.sort === 'price_asc') items = [...items].sort((a, b) => a.price - b.price)
  if (query.sort === 'price_desc') items = [...items].sort((a, b) => b.price - a.price)
  // Pad the catalogue so pagination is realistic in mock mode.
  const padded = Array.from({ length: 27 }, (_, i) => items.map((p) => ({ ...summary(p), id: p.id + i * 100 }))).flat()
  return paginate(padded, { per_page: 12, ...query })
})

mock.get('/properties/featured', () => ok(db.properties.slice(0, 6).map(summary)))

mock.get('/properties/facets', () =>
  ok({
    locations: ['Lagos Island', 'Lekki', 'Ikoyi', 'Victoria Island', 'Ikeja', 'Ajah', 'Port Harcourt', 'Maitama'],
    listing_types: ['sale', 'rent', 'lease'],
    property_types: ['apartment', 'duplex', 'house', 'land', 'commercial', 'office', 'warehouse', 'terrace'],
    price_ranges: [
      { label: 'Under ₦5M', min: null, max: 5_000_000 },
      { label: '₦5M – ₦50M', min: 5_000_000, max: 50_000_000 },
      { label: '₦50M – ₦200M', min: 50_000_000, max: 200_000_000 },
      { label: 'Above ₦200M', min: 200_000_000, max: null },
    ],
  }),
)

const findProperty = (slug: string) => {
  const p = db.properties.find((x) => x.slug === slug)
  if (!p) fail(404, 'This property is no longer available.', 'not_found')
  return p
}

mock.get('/properties/:slug', ({ params }) => ok(findProperty(params.slug ?? '')))

mock.get('/properties/:slug/similar', ({ params }) => {
  const p = findProperty(params.slug ?? '')
  return ok(db.properties.filter((x) => x.id !== p.id).slice(0, 6).map(summary))
})

mock.post('/properties/:slug/applications', ({ params, body }) => {
  const p = findProperty(params.slug ?? '')
  validate(body, { full_name: ['required'], email: ['required', 'email'], phone: ['required'], message: ['required'] })
  return created(
    { id: db.nextId(), reference: `APP-${db.state.seq}`, property_title: p.title, status: 'received', created_at: new Date().toISOString() },
    'Application submitted. A confirmation email has been sent to your inbox.',
  )
})

mock.get('/properties/:slug/inspection-availability', ({ params }) => {
  findProperty(params.slug ?? '')
  const days: InspectionAvailability[] = []
  const d = new Date()
  while (days.length < 10) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() === 0) continue
    days.push({ date: toISODate(d), times: d.getDay() === 6 ? ['10:00', '11:00', '12:00'] : ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'] })
  }
  return ok(days)
})

mock.post('/properties/:slug/inspections', ({ params, body }) => {
  const p = findProperty(params.slug ?? '')
  validate(body, { type: ['required'], attendee: ['required'], full_name: ['required'], email: ['required', 'email'], phone: ['required'], date: ['required'], time: ['required'] })
  const scheduled = new Date(`${body.date}T${body.time}:00`)
  if (scheduled.getTime() < Date.now()) validationFail({ date: ['Choose a future date.'] })
  return created(
    {
      id: db.nextId(),
      reference: `INS-${db.state.seq}`,
      property_title: p.title,
      type: body.type,
      scheduled_for: scheduled.toISOString(),
      status: 'scheduled',
      calendar_url: '',
    },
    'Inspection booked. A confirmation email has been sent to your inbox.',
  )
})

/* ------------------------------------------------------------------ */
/* Owner listings                                                      */
/* ------------------------------------------------------------------ */

mock.get('/listings/fee', () =>
  ok({ amount: db.state.settings.fees.listing_fee, currency: 'NGN', description: 'One-time registration fee covering inspection, verification and marketing.' }),
)

const ownedListing = (id: number, userId: number) => {
  const l = db.state.listings.find((x) => x.id === id && ((x as Listing & { userId?: number }).userId ?? 1) === userId)
  if (!l) fail(404, 'Listing not found.', 'not_found')
  return l
}

mock.get('/me/listings', (ctx) => {
  const user = requireAuth(ctx)
  const status = arrayParam(ctx.query, 'status')
  const listingType = arrayParam(ctx.query, 'listing_type')
  const propertyType = arrayParam(ctx.query, 'property_type')
  const items = db.state.listings.filter(
    (l) =>
      ((l as Listing & { userId?: number }).userId ?? 1) === user.id &&
      (!status.length || status.includes(l.status)) &&
      (!listingType.length || listingType.includes(l.listing_type)) &&
      (!propertyType.length || propertyType.includes(l.property_type)),
  )
  return paginate(items, ctx.query)
})

mock.get('/me/listings/:id', (ctx) => ok(ownedListing(Number(ctx.params.id), requireAuth(ctx).id)))

const LISTING_RULES = {
  listing_type: ['required'],
  property_type: ['required'],
  state: ['required'],
  city: ['required'],
  address: ['required'],
  asking_price: ['required', 'numeric'],
  condition: ['required'],
  furnishing: ['required'],
} as const

function titleFor(body: Record<string, unknown>) {
  if (body.title) return String(body.title)
  const type = String(body.property_type).replace('_', ' ')
  const beds = body.bedrooms ? `${body.bedrooms} Bed ` : ''
  return `${beds}${type.charAt(0).toUpperCase()}${type.slice(1)}, ${body.city}`
}

mock.post('/listings', (ctx) => {
  const user = requireAuth(ctx)
  validate(ctx.body, LISTING_RULES as never)
  const listing: Listing & { userId: number } = {
    ...(ctx.body as unknown as ListingDetailsPayload),
    id: db.nextId(),
    reference: `LST-${db.state.seq}`,
    title: titleFor(ctx.body),
    status: 'draft',
    photos: [],
    documents: [],
    listed_at: null,
    rejection_reason: null,
    financial_summary: null,
    activity: null,
    created_at: new Date().toISOString(),
    userId: user.id,
  }
  db.state.listings.unshift(listing)
  db.save()
  return created(listing, 'Listing details saved.')
})

mock.put('/listings/:id', (ctx) => {
  const listing = ownedListing(Number(ctx.params.id), requireAuth(ctx).id)
  validate(ctx.body, LISTING_RULES as never)
  Object.assign(listing, ctx.body, { title: titleFor(ctx.body) })
  db.save()
  return ok(listing, 'Listing updated.')
})

mock.post('/listings/:id/photos', async (ctx) => {
  const listing = ownedListing(Number(ctx.params.id), requireAuth(ctx).id)
  const file = ctx.formData?.get('photo')
  if (!(file instanceof File)) validationFail({ photo: ['Choose a photo to upload.'] })
  if (listing.photos.length >= 10) validationFail({ photo: ['You can upload up to 10 photos.'] })
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) validationFail({ photo: ['Photos must be JPG or PNG.'] })
  if (file.size > 5 * 1024 * 1024) validationFail({ photo: ['Each photo must be 5MB or smaller.'] })
  const media = await mediaFromFile(file, 'listing_photo')
  listing.photos.push(media)
  db.save()
  return created(media, 'Photo uploaded.')
})

mock.delete('/listings/:id/photos/:mediaId', (ctx) => {
  const listing = ownedListing(Number(ctx.params.id), requireAuth(ctx).id)
  listing.photos = listing.photos.filter((p) => p.id !== Number(ctx.params.mediaId))
  db.save()
  return ok(null, 'Photo removed.')
})

mock.post('/listings/:id/submit', (ctx) => {
  const listing = ownedListing(Number(ctx.params.id), requireAuth(ctx).id)
  if (ctx.body.confirm_accuracy !== true) validationFail({ confirm_accuracy: ['Please confirm the details are accurate.'] })
  if (listing.photos.length < 1) validationFail({ photos: ['Upload at least one photo before submitting.'] })
  listing.status = 'awaiting_payment'
  if (!listing.documents.length) listing.documents = listingDocuments().slice(0, 1)
  db.save()
  return ok(listing, 'Listing submitted. Complete payment to send it for verification.')
})

/* ------------------------------------------------------------------ */
/* Holdings                                                            */
/* ------------------------------------------------------------------ */

mock.get('/me/holdings', (ctx) => {
  const user = requireAuth(ctx)
  const type = arrayParam(ctx.query, 'holding_type')
  const status = arrayParam(ctx.query, 'status')
  const items = (db.holdings[user.id] ?? [])
    .filter((h) => (!type.length || type.includes(h.holding_type)) && (!status.length || status.includes(h.status)))
    .map(({ documents: _d, payments: _p, maintenance_requests: _m, ...rest }) => rest)
  return paginate(items, ctx.query)
})

mock.get('/me/holdings/:id', (ctx) => {
  const h = (db.holdings[requireAuth(ctx).id] ?? []).find((x) => x.id === Number(ctx.params.id))
  if (!h) fail(404, 'Property not found.', 'not_found')
  return ok(h)
})

mock.post('/me/holdings/:id/maintenance-requests', (ctx) => {
  const h = (db.holdings[requireAuth(ctx).id] ?? []).find((x) => x.id === Number(ctx.params.id))
  if (!h) fail(404, 'Property not found.')
  validate(ctx.body, { title: ['required'], description: ['required'] })
  const req = { id: db.nextId(), title: String(ctx.body.title), description: String(ctx.body.description), status: 'pending' as const, created_at: toISODate(new Date()) }
  h.maintenance_requests.unshift(req)
  return created(req, 'Maintenance request logged. The facility manager has been notified.')
})
