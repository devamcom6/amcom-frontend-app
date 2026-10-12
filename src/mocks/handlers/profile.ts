import type { NextOfKin, PayoutAccount } from '@/types'
import { db } from '../db'
import { mediaFromFile } from '../media'
import { created, fail, mock, ok, requireAuth, validate, validationFail } from '../router'
import { MOCK_OTP } from './auth'

const profileOf = (id: number) => {
  const p = db.state.profiles[id]
  if (!p) fail(404, 'Profile not found.')
  return p
}

mock.get('/profile', (ctx) => ok(db.profile(requireAuth(ctx))))

mock.put('/profile', (ctx) => {
  const user = requireAuth(ctx)
  const p = profileOf(user.id)
  const b = ctx.body as Record<string, string | null>
  const locked = p.identity?.locked_fields ?? []
  if ((b.first_name !== undefined && locked.includes('first_name') && b.first_name !== user.first_name) ||
      (b.last_name !== undefined && locked.includes('last_name') && b.last_name !== user.last_name)) {
    fail(422, 'Name fields are locked after identity verification.', 'field_locked')
  }
  validate(b, { phone: ['required'] })
  if (b.first_name !== undefined) user.first_name = b.first_name
  if (b.last_name !== undefined) user.last_name = b.last_name
  user.name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email
  user.phone = b.phone ?? user.phone
  Object.assign(p.contact, {
    phone: b.phone ?? p.contact.phone,
    alt_phone: b.alt_phone ?? p.contact.alt_phone,
    country: b.country ?? p.contact.country,
    state: b.state ?? p.contact.state,
    city: b.city ?? p.contact.city,
    address: b.address ?? p.contact.address,
  })
  db.save()
  return ok(db.profile(user), 'Profile updated.')
})

mock.post('/profile/avatar', async (ctx) => {
  const user = requireAuth(ctx)
  const file = ctx.formData?.get('avatar')
  if (!(file instanceof File)) validationFail({ avatar: ['Please choose an image.'] })
  user.avatar = await mediaFromFile(file, 'avatar')
  db.save()
  return ok(user.avatar, 'Profile photo updated.')
})

mock.post('/profile/identity/verify', (ctx) => {
  const user = requireAuth(ctx)
  validate(ctx.body, { id_type: ['required'], id_number: ['required', 'min:6'] })
  if (String(ctx.body.id_number).startsWith('000')) {
    fail(422, "We couldn't verify this ID. Check the number and try again.", 'identity_verification_failed')
  }
  const p = profileOf(user.id)
  p.identity = {
    status: 'verified',
    id_type: ctx.body.id_type as never,
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1992-05-04',
    gender: 'male',
    nationality: 'Nigerian',
    locked_fields: ['first_name', 'last_name', 'date_of_birth', 'gender', 'nationality'],
  }
  p.personal = { ...p.personal, first_name: 'John', last_name: 'Doe', date_of_birth: '1992-05-04', gender: 'male', nationality: 'Nigerian' }
  p.onboarding_step = 'personal'
  user.kyc_status = 'verified'
  user.first_name = 'John'
  user.last_name = 'Doe'
  user.name = 'John Doe'
  db.save()
  return ok(p.identity, 'Identity verified.')
})

mock.put('/profile/personal', (ctx) => {
  const user = requireAuth(ctx)
  validate(ctx.body, { state_of_origin: ['required'], lga: ['required'] })
  const p = profileOf(user.id)
  p.personal.state_of_origin = String(ctx.body.state_of_origin)
  p.personal.lga = String(ctx.body.lga)
  if (!p.identity) {
    p.personal.first_name = (ctx.body.first_name as string) ?? p.personal.first_name
    p.personal.last_name = (ctx.body.last_name as string) ?? p.personal.last_name
  }
  p.onboarding_step = 'contact'
  db.save()
  return ok(db.profile(user), 'Personal information saved.')
})

mock.put('/profile/contact', (ctx) => {
  const user = requireAuth(ctx)
  validate(ctx.body, { country: ['required'], state: ['required'], address: ['required'], phone: ['required'] })
  const p = profileOf(user.id)
  Object.assign(p.contact, ctx.body)
  user.phone = String(ctx.body.phone)
  p.onboarding_step = 'next_of_kin'
  db.save()
  return ok(db.profile(user), 'Contact details saved.')
})

mock.put('/profile/next-of-kin', (ctx) => {
  const user = requireAuth(ctx)
  validate(ctx.body, { full_name: ['required'], relationship: ['required'], phone: ['required'] })
  const p = profileOf(user.id)
  p.next_of_kin = { ...(ctx.body as unknown as NextOfKin), email: (ctx.body.email as string) || null }
  p.onboarding_step = 'completed'
  user.profile_completed = true
  db.save()
  return ok(db.profile(user), 'Next of kin saved.')
})

/* Phone change */
mock.post('/account/phone/change-request', (ctx) => {
  requireAuth(ctx)
  validate(ctx.body, { phone: ['required'] })
  return ok({ masked_destination: 'your active devices' }, 'Verification code sent.')
})

mock.post('/account/phone/change-confirm', (ctx) => {
  const user = requireAuth(ctx)
  if (ctx.body.code !== MOCK_OTP) validationFail({ code: ['The code is invalid or has expired.'] })
  user.phone = String(ctx.body.phone)
  profileOf(user.id).contact.phone = user.phone
  db.save()
  return ok(db.profile(user), 'Phone number updated.')
})

/* Payout accounts */
mock.get('/account/payout-accounts', (ctx) => ok(db.state.payoutAccounts[requireAuth(ctx).id] ?? []))

mock.post('/account/payout-accounts/resolve', (ctx) => {
  const user = requireAuth(ctx)
  validate(ctx.body, { bank_code: ['required'], account_number: ['required'] })
  if (!/^\d{10}$/.test(String(ctx.body.account_number))) validationFail({ account_number: ['Account number must be 10 digits.'] })
  return ok({ account_name: user.name.toUpperCase(), account_number: String(ctx.body.account_number), bank_code: String(ctx.body.bank_code) })
})

mock.post('/account/payout-accounts', async (ctx) => {
  const user = requireAuth(ctx)
  validate(ctx.body, { bank_code: ['required'], account_number: ['required'] })
  const { seedLookups } = await import('../data/content')
  const bank = seedLookups().banks.find((b) => b.code === ctx.body.bank_code)
  const list = (db.state.payoutAccounts[user.id] ??= [])
  const account: PayoutAccount = {
    id: db.nextId(),
    bank_code: String(ctx.body.bank_code),
    bank_name: bank?.name ?? 'Bank',
    account_number_masked: `••••••${String(ctx.body.account_number).slice(-4)}`,
    account_name: user.name.toUpperCase(),
    is_default: list.length === 0,
  }
  list.push(account)
  db.save()
  return created(account, 'Payout account added.')
})

mock.delete('/account/payout-accounts/:id', (ctx) => {
  const user = requireAuth(ctx)
  db.state.payoutAccounts[user.id] = (db.state.payoutAccounts[user.id] ?? []).filter((a) => a.id !== Number(ctx.params.id))
  db.save()
  return ok(null, 'Payout account removed.')
})

/* Notification preferences */
mock.get('/account/notification-preferences', (ctx) => {
  const user = requireAuth(ctx)
  return ok(db.state.preferences[user.id] ?? db.defaultPreferences)
})

mock.put('/account/notification-preferences', (ctx) => {
  const user = requireAuth(ctx)
  const prefs = (ctx.body.preferences ?? {}) as Record<string, boolean>
  const next = (db.state.preferences[user.id] ?? structuredClone(db.defaultPreferences)).map((p) =>
    p.locked ? p : { ...p, enabled: prefs[p.key] ?? p.enabled },
  )
  db.state.preferences[user.id] = next
  db.save()
  return ok(next, 'Notification preferences saved.')
})

mock.post('/support/tickets', (ctx) => {
  requireAuth(ctx)
  validate(ctx.body, { category: ['required'], subject: ['required'], message: ['required', 'min:10'] })
  return created({ reference: `SUP-${db.nextId()}` }, 'Your request has been received. Our team will respond within 24 hours.')
})
