import { AxiosError, type AxiosAdapter, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { config } from '@/config/env'
import { db } from './db'
import { matchRoute, MockHttpError, type MockContext } from './router'

// Register every handler module (side-effect imports).
import './handlers/auth'
import './handlers/profile'
import './handlers/investments'
import './handlers/payments'
import './handlers/properties'
import './handlers/content'
import './handlers/admin'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function parseQuery(params: unknown): Record<string, unknown> {
  if (!params || typeof params !== 'object') return {}
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
    if (v === undefined || v === null || v === '') continue
    out[k.replace(/\[\]$/, '')] = v
  }
  return out
}

function parseBody(data: unknown): { body: Record<string, unknown>; formData: FormData | null } {
  if (data instanceof FormData) return { body: {}, formData: data }
  if (typeof data === 'string' && data) {
    try {
      return { body: JSON.parse(data) as Record<string, unknown>, formData: null }
    } catch {
      return { body: {}, formData: null }
    }
  }
  if (data && typeof data === 'object') return { body: data as Record<string, unknown>, formData: null }
  return { body: {}, formData: null }
}

function resolveUser(token: string | null) {
  if (!token) return null
  const session = db.state.sessions[token]
  if (!session) return null
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    delete db.state.sessions[token]
    return null
  }
  return db.state.users.find((u) => u.id === session.userId) ?? null
}

const mockAdapter: AxiosAdapter = async (request: InternalAxiosRequestConfig) => {
  const method = (request.method ?? 'get').toLowerCase()
  const url = new URL(request.url ?? '', 'http://mock.local')
  const path = url.pathname
  const auth = request.headers?.get?.('Authorization') as string | undefined
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null

  const urlQuery = Object.fromEntries(url.searchParams.entries())
  const { body, formData } = parseBody(request.data)
  const ctx: MockContext = {
    method,
    path,
    params: {},
    query: { ...urlQuery, ...parseQuery(request.params) },
    body: method === 'delete' && request.data ? parseBody(request.data).body : body,
    formData,
    token,
    user: resolveUser(token),
  }

  // Simulate upload progress for multipart requests.
  if (formData && request.onUploadProgress) {
    for (const loaded of [25, 60, 100]) {
      await sleep(config.mockLatencyMs / 3)
      request.onUploadProgress({ loaded, total: 100, bytes: loaded, lengthComputable: true } as never)
    }
  } else {
    await sleep(config.mockLatencyMs * (0.6 + Math.random() * 0.8))
  }

  const match = matchRoute(method, path)
  const respond = (status: number, payload: unknown, headers: Record<string, string> = {}) => {
    // Serialise like a real network hop so callers never share references with the mock database.
    const data = payload instanceof Blob ? payload : JSON.parse(JSON.stringify(payload ?? null))
    const response = { data, status, statusText: String(status), headers, config: request, request: {} }
    if (status >= 400) {
      throw new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_REQUEST, request, {}, response)
    }
    return response
  }

  if (!match) {
    console.warn(`[mock] no handler for ${method.toUpperCase()} ${path}`)
    return respond(404, { success: false, message: 'Endpoint not found.', code: 'not_found' })
  }

  try {
    ctx.params = match.params
    const result = await match.handler(ctx)
    return respond(result.status, result.data, result.headers)
  } catch (error) {
    if (error instanceof MockHttpError) return respond(error.status, error.body, error.headers)
    if (error instanceof AxiosError) throw error
    console.error('[mock] handler crashed', error)
    // Simulates a Laravel 500 — the message must never reach the UI.
    return respond(500, { success: false, message: `Exception: ${(error as Error).message} in Handler.php line 42` })
  }
}

export function installMockAdapter(instance: AxiosInstance): void {
  instance.defaults.adapter = mockAdapter
  console.info(
    '%c[amcom] Mock API enabled%c — demo logins: user@amcom.test, new@amcom.test, admin@amcom.test, superadmin@amcom.test (Password123!). OTP: 123456',
    'color:#2e6f62;font-weight:bold',
    'color:inherit',
  )
}
