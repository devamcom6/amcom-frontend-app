/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_URL: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_TIMEOUT_MS?: string
  readonly VITE_USE_MOCK_API: string
  readonly VITE_MOCK_LATENCY_MS?: string
  readonly VITE_DEV_API_PROXY?: string
  readonly VITE_SUPPORT_EMAIL: string
  readonly VITE_SUPPORT_PHONE: string
  readonly VITE_GOOGLE_AUTH_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
