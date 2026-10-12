import { get, post } from '@/services/http/client'
import type {
  AuthSession,
  AuthUser,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  GoogleRedirectResponse,
  LoginPayload,
  LoginResult,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
  VerifyResetCodePayload,
  VerifyResetCodeResponse,
} from '@/types'

/** /api/v1/auth/* — see BACKEND_API_CONTRACT.md §4 */
export const authService = {
  login: (payload: LoginPayload) => post<LoginResult>('/auth/login', payload, { skipAuthHandling: true }),

  register: (payload: RegisterPayload) => post<AuthSession>('/auth/register', payload, { skipAuthHandling: true }),

  logout: () => post<null>('/auth/logout', undefined, { skipAuthHandling: true }),

  me: () => get<AuthUser>('/auth/me', { skipAuthHandling: true }),

  verifyEmail: (payload: VerifyEmailPayload) => post<AuthUser>('/auth/email/verify', payload),

  resendVerification: () => post<null>('/auth/email/resend'),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    post<null>('/auth/password/forgot', payload, { skipAuthHandling: true }),

  verifyResetCode: (payload: VerifyResetCodePayload) =>
    post<VerifyResetCodeResponse>('/auth/password/verify-code', payload, { skipAuthHandling: true }),

  resetPassword: (payload: ResetPasswordPayload) =>
    post<null>('/auth/password/reset', payload, { skipAuthHandling: true }),

  changePassword: (payload: ChangePasswordPayload) => post<null>('/auth/password/change', payload),

  googleRedirect: (redirectTo: string) =>
    get<GoogleRedirectResponse>('/auth/google/redirect', { params: { redirect_to: redirectTo }, skipAuthHandling: true }),

  googleCallback: (query: Record<string, string>) =>
    post<AuthSession>('/auth/google/callback', query, { skipAuthHandling: true }),
}

export function isTwoFactorChallenge(result: LoginResult): result is Extract<LoginResult, { two_factor_required: true }> {
  return 'two_factor_required' in result
}
