import type { SignedDownload } from '@/types'
import { db } from '../db'
import { seedLookups } from '../data/content'
import { mediaFromFile } from '../media'
import { created, fail, mock, ok, paginate, requireAuth, validate, validationFail } from '../router'

mock.get('/content/home', () => ok({ ...db.homeContent, testimonials: db.homeContent.testimonials.filter((t) => t.is_published) }))

mock.get('/content/faqs', ({ query }) =>
  ok(db.faqs.filter((f) => f.is_published && (!query.product || f.product === query.product)).sort((a, b) => a.position - b.position)),
)

mock.get('/content/pages/:slug', ({ params }) => {
  const page = db.pages.find((p) => p.slug === params.slug)
  if (!page) fail(404, 'Page not found.', 'not_found')
  return ok(page)
})

mock.get('/lookups', () => ok(seedLookups()))

mock.post('/contact', ({ body }) => {
  validate(body, { full_name: ['required'], email: ['required', 'email'], subject: ['required'], message: ['required', 'min:10'] })
  return created({ reference: `MSG-${db.nextId()}` }, 'Thanks for reaching out. Our team will reply within one business day.')
})

/* Notifications */
mock.get('/notifications', (ctx) => {
  const user = requireAuth(ctx)
  const list = db.state.notifications[user.id] ?? []
  const items = ctx.query.unread === 'true' || ctx.query.unread === true ? list.filter((n) => !n.read_at) : list
  return paginate(items, ctx.query)
})

mock.get('/notifications/unread-count', (ctx) => {
  const user = requireAuth(ctx)
  return ok({ unread: (db.state.notifications[user.id] ?? []).filter((n) => !n.read_at).length })
})

mock.post('/notifications/read-all', (ctx) => {
  const user = requireAuth(ctx)
  const now = new Date().toISOString()
  ;(db.state.notifications[user.id] ?? []).forEach((n) => (n.read_at ??= now))
  db.save()
  return ok(null, 'All notifications marked as read.')
})

mock.post('/notifications/:id/read', (ctx) => {
  const user = requireAuth(ctx)
  const n = (db.state.notifications[user.id] ?? []).find((x) => x.id === ctx.params.id)
  if (!n) fail(404, 'Notification not found.')
  n.read_at ??= new Date().toISOString()
  db.save()
  return ok(n)
})

/* Media & documents */
mock.post('/media', async (ctx) => {
  requireAuth(ctx)
  const file = ctx.formData?.get('file')
  if (!(file instanceof File)) validationFail({ file: ['Choose a file to upload.'] })
  const media = await mediaFromFile(file, (ctx.formData?.get('collection') as never) ?? 'content')
  const alt = ctx.formData?.get('alt_text')
  if (typeof alt === 'string' && alt) media.alt_text = alt
  return created(media, 'File uploaded.')
})

mock.patch('/media/:id', (ctx) => {
  requireAuth(ctx)
  return ok({ id: Number(ctx.params.id), alt_text: ctx.body.alt_text }, 'Alt text updated.')
})

mock.delete('/media/:id', (ctx) => {
  requireAuth(ctx)
  return ok(null, 'File deleted.')
})

mock.get('/documents/:id/download', (ctx) => {
  requireAuth(ctx)
  const payload: SignedDownload = {
    url: '/mock-media/agreement-sample.pdf',
    filename: `amcom-document-${ctx.params.id}.pdf`,
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
  }
  return ok(payload)
})

