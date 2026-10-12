/**
 * Typed, validated access to build-time environment variables.
 * Only public configuration belongs here — every VITE_* value ships to the browser.
 */
function bool(value: string | undefined, fallback = false): boolean {
  if (value === undefined || value === '') return fallback
  return value === 'true' || value === '1'
}

function int(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

const env = import.meta.env

export const config = Object.freeze({
  appName: env.VITE_APP_NAME || 'Amcom',
  appUrl: (env.VITE_APP_URL || window.location.origin).replace(/\/$/, ''),
  apiBaseUrl: (env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, ''),
  apiTimeoutMs: int(env.VITE_API_TIMEOUT_MS, 20_000),
  useMockApi: bool(env.VITE_USE_MOCK_API, false),
  mockLatencyMs: int(env.VITE_MOCK_LATENCY_MS, 450),
  supportEmail: env.VITE_SUPPORT_EMAIL || 'info@houvincity.com',
  supportPhone: env.VITE_SUPPORT_PHONE || '+234 707 469 3320',
  googleAuthEnabled: bool(env.VITE_GOOGLE_AUTH_ENABLED, false),
  isProduction: env.PROD,
})

if (config.isProduction && config.useMockApi) {
  // Guard against shipping a build that silently serves fake data.
  console.error('[amcom] VITE_USE_MOCK_API is enabled in a production build.')
}

export type AppConfig = typeof config
