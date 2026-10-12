/**
 * Small composable validation rules used by `useForm`.
 * Frontend validation is a UX aid only — Laravel validation is authoritative.
 */
export type Rule<V = unknown, F = Record<string, unknown>> = (value: V, form: F) => string | true

const isEmpty = (v: unknown) =>
  v === null || v === undefined || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0)

export const required =
  (message = 'This field is required.'): Rule =>
  (v) =>
    isEmpty(v) ? message : true

export const email =
  (message = 'Enter a valid email address.'): Rule =>
  (v) =>
    isEmpty(v) || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()) ? true : message

export const minLength =
  (min: number, message?: string): Rule =>
  (v) =>
    isEmpty(v) || String(v).length >= min ? true : (message ?? `Must be at least ${min} characters.`)

export const maxLength =
  (max: number, message?: string): Rule =>
  (v) =>
    isEmpty(v) || String(v).length <= max ? true : (message ?? `Must be ${max} characters or fewer.`)

/** Nigerian-friendly phone validation: +234XXXXXXXXXX, 234…, or 0XXXXXXXXXX. */
export const phone =
  (message = 'Enter a valid phone number.'): Rule =>
  (v) => {
    if (isEmpty(v)) return true
    const digits = String(v).replace(/[\s()-]/g, '')
    return /^(\+?234|0)?[789][01]\d{8}$/.test(digits) || /^\+?\d{10,15}$/.test(digits) ? true : message
  }

export const numeric =
  (message = 'Enter a valid number.'): Rule =>
  (v) =>
    isEmpty(v) || Number.isFinite(Number(v)) ? true : message

export const minValue =
  (min: number, message?: string): Rule =>
  (v) =>
    isEmpty(v) || Number(v) >= min ? true : (message ?? `Must be at least ${min}.`)

export const pattern =
  (regex: RegExp, message: string): Rule =>
  (v) =>
    isEmpty(v) || regex.test(String(v)) ? true : message

export const sameAs =
  <F extends Record<string, unknown>>(field: keyof F, message = 'Values do not match.'): Rule<unknown, F> =>
  (v, form) =>
    v === form[field] ? true : message

export const strongPassword =
  (message = 'Use 8+ characters with upper & lower case letters and a number.'): Rule =>
  (v) => {
    if (isEmpty(v)) return true
    const s = String(v)
    return s.length >= 8 && /[a-z]/.test(s) && /[A-Z]/.test(s) && /\d/.test(s) ? true : message
  }

export const accepted =
  (message = 'You must accept to continue.'): Rule =>
  (v) =>
    v === true ? true : message

export const sixDigitCode =
  (message = 'Enter the 6-digit code.'): Rule =>
  (v) =>
    /^\d{6}$/.test(String(v ?? '').trim()) ? true : message
