import { AxiosError } from 'axios'
import type { ApiErrorBody, ValidationErrors } from '@/types'

export type ApiErrorKind =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'server'
  | 'network'
  | 'timeout'
  | 'cancelled'
  | 'unknown'

const GENERIC_MESSAGES: Record<ApiErrorKind, string> = {
  validation: 'Please check the highlighted fields and try again.',
  unauthorized: 'Your session has ended. Please log in again.',
  forbidden: "You don't have permission to perform this action.",
  not_found: "We couldn't find what you were looking for.",
  conflict: 'This action conflicts with the current state. Please refresh and try again.',
  rate_limited: 'Too many attempts. Please wait a moment and try again.',
  server: 'Something went wrong on our side. Please try again shortly.',
  network: "We couldn't reach the server. Check your internet connection and try again.",
  timeout: 'The request took too long. Please try again.',
  cancelled: 'The request was cancelled.',
  unknown: 'Something went wrong. Please try again.',
}

/** Heuristic guard so raw framework/exception text is never shown to users. */
function looksTechnical(message: string): boolean {
  return /exception|sqlstate|stack trace|undefined (index|variable|offset)|call to (a )?(member|undefined)|\.php|vendor\/|line \d+/i.test(
    message,
  )
}

/**
 * Normalised error thrown by every service call.
 * `message` is always safe to display to an end user.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  readonly code: string | null
  readonly errors: ValidationErrors
  readonly retryAfterSeconds: number | null

  constructor(init: {
    kind: ApiErrorKind
    message?: string | null
    status?: number | null
    code?: string | null
    errors?: ValidationErrors
    retryAfterSeconds?: number | null
  }) {
    const safe =
      init.message && init.kind !== 'server' && !looksTechnical(init.message) ? init.message : GENERIC_MESSAGES[init.kind]
    super(safe)
    this.name = 'ApiError'
    this.kind = init.kind
    this.status = init.status ?? null
    this.code = init.code ?? null
    this.errors = init.errors ?? {}
    this.retryAfterSeconds = init.retryAfterSeconds ?? null
  }

  get isValidation() {
    return this.kind === 'validation'
  }

  /** First message for a field, e.g. `error.fieldError('email')`. */
  fieldError(field: string): string | undefined {
    return this.errors[field]?.[0]
  }
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401 || status === 419) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict'
  if (status === 422) return 'validation'
  if (status === 429) return 'rate_limited'
  if (status >= 500) return 'server'
  return 'unknown'
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (error instanceof AxiosError) {
    if (error.code === AxiosError.ERR_CANCELED) return new ApiError({ kind: 'cancelled' })
    if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT) {
      return new ApiError({ kind: 'timeout' })
    }
    if (!error.response) return new ApiError({ kind: 'network' })

    const { status, data, headers } = error.response
    const body = (data ?? {}) as Partial<ApiErrorBody>
    const retryAfter = Number(headers?.['retry-after'])
    return new ApiError({
      kind: kindFromStatus(status),
      status,
      message: typeof body.message === 'string' ? body.message : null,
      code: body.code ?? null,
      errors: body.errors ?? {},
      retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : null,
    })
  }

  return new ApiError({ kind: 'unknown' })
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
