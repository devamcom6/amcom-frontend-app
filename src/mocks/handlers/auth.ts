import { DEFAULT_ROLE_PERMISSIONS } from '@/constants/access'
import type { AuthSession, LoginActivity } from '@/types'
import { db, type MockUserRecord } from '../db'
import { created, fail, mock, ok, requireAuth, validate, validationFail } from '../router'

/** In mock mode every emailed/SMS code is 123456. */
export const MOCK_OTP = '123456'

function issueSession(user: MockUserRecord, remember = false): AuthSession {
  const token = `mock_${user.id}_${crypto.randomUUID().replace(/-/g, '')}`
  const expiresAt = new Date(Date.now() + (remember ? 30 : 1) * 86_400_000).toISOString()
  db.state.sessions[token] = { userId: user.id, expiresAt }
  db.save()
  return { user: db.publicUser(user), token, token_type: 'Bearer', expires_at: expiresAt }
}

mock.post('/auth/login', ({ body }) => {
  validate(body, { email: ['required', 'email'], password: ['required'] })
  const user = db.state.users.find((u) => u.email.toLowerCase() === String(body.email).toLowerCase())
  if (!user || user.password !== body.password) {
    fail(401, 'These credentials do not match our records.', 'invalid_credentials')
  }
  if (user.status === 'suspended') fail(403, 'Your account has been suspended. Contact support.', 'account_suspended')
  if (user.two_factor_enabled && !body.two_factor_code) {
    return ok({ two_factor_required: true, channel: 'sms', masked_destination: '+234 ••• ••• 2222' }, 'Two-factor code sent.')
  }
  if (user.two_factor_enabled && body.two_factor_code !== MOCK_OTP) {
    validationFail({ two_factor_code: ['The code you entered is invalid or has expired.'] })
  }
  return ok(issueSession(user, Boolean(body.remember)), 'Login successful.')
})

mock.post('/auth/register', ({ body }) => {
  validate(body, { email: ['required', 'email'], password: ['required', 'min:8', 'confirmed'] })
  const email = String(body.email).toLowerCase()
  if (db.state.users.some((u) => u.email === email)) {
    validationFail({ email: ['The email has already been taken.'] })
  }
  const user: MockUserRecord = {
    id: db.nextId(),
    first_name: null,
    last_name: null,
    name: email,
    email,
    phone: null,
    avatar: null,
    role: 'user',
    permissions: DEFAULT_ROLE_PERMISSIONS.user,
    status: 'active',
    email_verified_at: null,
    kyc_status: 'unverified',
    profile_completed: false,
    two_factor_enabled: false,
    created_at: new Date().toISOString(),
    password: String(body.password),
  }
  db.state.users.push(user)
  db.state.profiles[user.id] = {
    identity: null,
    personal: { first_name: null, last_name: null, date_of_birth: null, gender: null, nationality: null, state_of_origin: null, lga: null },
    contact: { country: null, state: null, city: null, address: null, phone: null, alt_phone: null },
    next_of_kin: null,
    onboarding_step: 'identity',
  }
  db.state.emailCodes[email] = MOCK_OTP
  console.info(`[mock] verification code for ${email}: ${MOCK_OTP}`)
  return created(issueSession(user), 'Account created. We sent a 6-digit code to your email.')
})

mock.post('/auth/logout', (ctx) => {
  if (ctx.token) delete db.state.sessions[ctx.token]
  db.save()
  return ok(null, 'Logged out.')
})

mock.get('/auth/me', (ctx) => ok(db.publicUser(requireAuth(ctx))))

mock.post('/auth/email/verify', (ctx) => {
  const user = requireAuth(ctx)
  validate(ctx.body, { code: ['required'] })
  if (String(ctx.body.code) !== MOCK_OTP) validationFail({ code: ['The verification code is invalid or has expired.'] })
  user.email_verified_at = new Date().toISOString()
  db.save()
  return ok(db.publicUser(user), 'Email verified.')
})

mock.post('/auth/email/resend', (ctx) => {
  requireAuth(ctx)
  return ok(null, 'A new code has been sent to your email.')
})

mock.post('/auth/password/forgot', ({ body }) => {
  validate(body, { email: ['required', 'email'] })
  // Always succeed to avoid account enumeration.
  console.info(`[mock] password reset code: ${MOCK_OTP}`)
  return ok(null, 'If an account exists for that email, we have sent a reset code.')
})

mock.post('/auth/password/verify-code', ({ body }) => {
  validate(body, { email: ['required', 'email'], code: ['required'] })
  if (String(body.code) !== MOCK_OTP) validationFail({ code: ['The code is invalid or has expired.'] })
  const token = crypto.randomUUID()
  db.state.resetTokens[String(body.email).toLowerCase()] = token
  db.save()
  return ok({ reset_token: token, expires_at: new Date(Date.now() + 15 * 60_000).toISOString() }, 'Code verified.')
})

mock.post('/auth/password/reset', ({ body }) => {
  validate(body, { email: ['required', 'email'], reset_token: ['required'], password: ['required', 'min:8', 'confirmed'] })
  const email = String(body.email).toLowerCase()
  if (db.state.resetTokens[email] !== body.reset_token) fail(422, 'This reset link has expired. Request a new code.', 'reset_token_invalid')
  const user = db.state.users.find((u) => u.email === email)
  if (user) user.password = String(body.password)
  delete db.state.resetTokens[email]
  db.save()
  return ok(null, 'Your password has been reset.')
})

mock.post('/auth/password/change', (ctx) => {
  const user = requireAuth(ctx)
  validate(ctx.body, { current_password: ['required'], password: ['required', 'min:8', 'confirmed'] })
  if (ctx.body.current_password !== user.password) validationFail({ current_password: ['The current password is incorrect.'] })
  if (ctx.body.password === user.password) validationFail({ password: ['Your new password must be different from your previous password.'] })
  user.password = String(ctx.body.password)
  db.save()
  return ok(null, 'Password updated.')
})

mock.get('/auth/google/redirect', () => fail(503, 'Google sign-in is not available in mock mode.', 'provider_unavailable'))

/* Sessions & 2FA */
mock.get('/account/sessions', (ctx) => {
  requireAuth(ctx)
  const items: LoginActivity[] = [
    { id: 1, date: new Date().toISOString().slice(0, 10), device: 'Chrome on MacOS', location: 'Port Harcourt, NG', ip_address: '102.89.xx.xx', status: 'current' },
    { id: 2, date: '2026-08-18', device: 'Safari on iPhone', location: 'Lagos, NG', ip_address: '197.210.xx.xx', status: 'signed_out' },
    { id: 3, date: '2026-08-15', device: 'Chrome on Windows', location: 'Port Harcourt, NG', ip_address: '102.89.xx.xx', status: 'signed_out' },
  ]
  return ok(items)
})

mock.delete('/account/sessions/:id', (ctx) => {
  requireAuth(ctx)
  return ok(null, 'Session revoked.')
})

mock.post('/account/two-factor/enable', (ctx) => {
  const user = requireAuth(ctx)
  return ok({ channel: 'sms', masked_destination: user.phone ? user.phone.replace(/\d(?=\d{4})/g, '•') : 'your phone' }, 'Code sent.')
})

mock.post('/account/two-factor/confirm', (ctx) => {
  const user = requireAuth(ctx)
  if (ctx.body.code !== MOCK_OTP) validationFail({ code: ['The code is invalid or has expired.'] })
  user.two_factor_enabled = true
  db.save()
  return ok({ recovery_codes: ['7K2D-9QXA', 'M4PZ-1LRB', 'W8NC-3TYE', 'H6VF-5JSU'] }, 'Two-factor authentication enabled.')
})

mock.post('/account/two-factor/disable', (ctx) => {
  const user = requireAuth(ctx)
  if (ctx.body.password !== user.password) validationFail({ password: ['The password is incorrect.'] })
  user.two_factor_enabled = false
  db.save()
  return ok(null, 'Two-factor authentication disabled.')
})

mock.delete('/account', (ctx) => {
  const user = requireAuth(ctx)
  if (ctx.body.confirmation !== 'DELETE') validationFail({ confirmation: ['Type DELETE to confirm.'] })
  user.status = 'pending_deletion'
  db.state.users = db.state.users.filter((u) => u.id !== user.id)
  for (const [t, s] of Object.entries(db.state.sessions)) if (s.userId === user.id) delete db.state.sessions[t]
  db.save()
  return ok(null, 'Your account has been scheduled for deletion.')
})
