import type { ApiErrorBody, ListQuery, Paginated, Permission, ValidationErrors } from '@/types'
import type { MockUserRecord } from './db'

/**
 * Minimal route table for the in-browser mock API.
 * Handlers return the exact envelope the Laravel API will return.
 */
export interface MockContext {
  method: string
  path: string
  params: Record<string, string>
  query: Record<string, unknown>
  body: Record<string, unknown>
  formData: FormData | null
  token: string | null
  user: MockUserRecord | null
}

export interface MockResult {
  status: number
  data: unknown
  headers?: Record<string, string>
}

export class MockHttpError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody,
    readonly headers: Record<string, string> = {},
  ) {
    super(body.message)
  }
}

type Handler = (ctx: MockContext) => MockResult | Promise<MockResult>

interface Route {
  method: string
  pattern: RegExp
  keys: string[]
  handler: Handler
}

const routes: Route[] = []

function compile(path: string) {
  const keys: string[] = []
  const pattern = new RegExp(
    '^' +
      path.replace(/\//g, '\\/').replace(/:(\w+)/g, (_, key: string) => {
        keys.push(key)
        return '([^\\/]+)'
      }) +
      '\\/?$',
  )
  return { pattern, keys }
}

function register(method: string) {
  return (path: string, handler: Handler) => {
    routes.push({ method, ...compile(path), handler })
  }
}

export const mock = {
  get: register('get'),
  post: register('post'),
  put: register('put'),
  patch: register('patch'),
  delete: register('delete'),
}

export function matchRoute(method: string, path: string) {
  for (const route of routes) {
    if (route.method !== method) continue
    const m = route.pattern.exec(path)
    if (!m) continue
    const params: Record<string, string> = {}
    route.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1] ?? '')))
    return { handler: route.handler, params }
  }
  return null
}

/* ------------------------------------------------------------------ */
/* Response helpers                                                    */
/* ------------------------------------------------------------------ */

export function ok<T>(data: T, message = 'Request completed successfully.', status = 200): MockResult {
  return { status, data: { success: true, message, data } }
}

export function created<T>(data: T, message = 'Created successfully.'): MockResult {
  return ok(data, message, 201)
}

export function paginate<T>(items: T[], query: ListQuery | Record<string, unknown>, message = 'Request completed successfully.'): MockResult {
  const page = Math.max(1, Number(query.page ?? 1))
  const perPage = Math.min(100, Math.max(1, Number(query.per_page ?? 15)))
  const total = items.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const start = (page - 1) * perPage
  const slice = items.slice(start, start + perPage)
  const result: Paginated<T> & { success: true; message: string } = {
    success: true,
    message,
    data: slice,
    meta: {
      current_page: page,
      per_page: perPage,
      total,
      last_page: lastPage,
      from: slice.length ? start + 1 : null,
      to: slice.length ? start + slice.length : null,
    },
  }
  return { status: 200, data: result }
}

export function fail(status: number, message: string, code?: string, errors?: ValidationErrors): never {
  throw new MockHttpError(status, { success: false, message, code, errors })
}

export function validationFail(errors: ValidationErrors, message = 'Validation failed.'): never {
  fail(422, message, 'validation_failed', errors)
}

export function requireAuth(ctx: MockContext): MockUserRecord {
  if (!ctx.user) fail(401, 'Unauthenticated.', 'unauthenticated')
  if (ctx.user.status === 'suspended') fail(403, 'Your account has been suspended. Contact support.', 'account_suspended')
  return ctx.user
}

export function requirePermission(ctx: MockContext, permission: Permission): MockUserRecord {
  const user = requireAuth(ctx)
  if (!user.permissions.includes(permission)) {
    fail(403, 'This action is unauthorized.', 'forbidden')
  }
  return user
}

/** Mirrors Laravel's `required` / `email` rules for mock validation. */
export function validate(
  body: Record<string, unknown>,
  rules: Record<string, ('required' | 'email' | 'numeric' | `min:${number}` | 'confirmed' | 'accepted')[]>,
): void {
  const errors: ValidationErrors = {}
  const add = (field: string, message: string) => (errors[field] ??= []).push(message)
  const label = (f: string) => f.replace(/_/g, ' ')

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = body[field]
    const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)
    for (const rule of fieldRules) {
      if (rule === 'required' && empty) add(field, `The ${label(field)} field is required.`)
      if (empty) continue
      if (rule === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        add(field, `The ${label(field)} field must be a valid email address.`)
      }
      if (rule === 'numeric' && !Number.isFinite(Number(value))) add(field, `The ${label(field)} field must be a number.`)
      if (rule.startsWith('min:')) {
        const min = Number(rule.slice(4))
        if (typeof value === 'number' ? value < min : String(value).length < min) {
          add(field, `The ${label(field)} field must be at least ${min}${typeof value === 'number' ? '' : ' characters'}.`)
        }
      }
      if (rule === 'confirmed' && value !== body[`${field}_confirmation`]) {
        add(field, `The ${label(field)} field confirmation does not match.`)
      }
      if (rule === 'accepted' && value !== true) add(field, `The ${label(field)} field must be accepted.`)
    }
  }
  if (Object.keys(errors).length) validationFail(errors)
}

/** Reads `?status[]=a&status[]=b` or `?status=a` into an array. */
export function arrayParam(query: Record<string, unknown>, key: string): string[] {
  const v = query[key] ?? query[`${key}[]`]
  if (v === undefined || v === null || v === '') return []
  return Array.isArray(v) ? v.map(String) : String(v).split(',')
}

export function textMatch(haystack: (string | null | undefined)[], needle: unknown): boolean {
  if (!needle) return true
  const n = String(needle).toLowerCase()
  return haystack.some((h) => h?.toLowerCase().includes(n))
}
