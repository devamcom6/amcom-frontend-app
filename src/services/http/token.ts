import { STORAGE_KEYS, readString, removeKey, writeString } from '@/utils/storage'

/**
 * Bearer-token persistence (Laravel Sanctum personal access tokens).
 *
 * "Remember me" keeps the token in localStorage; otherwise it lives in sessionStorage
 * and disappears with the tab. The token is never logged or sent anywhere except the
 * configured API origin. When the backend moves to cookie-based SPA auth, set
 * VITE_AUTH_MODE=cookie and this store simply stays empty.
 */
let memoryToken: string | null = null
let memoryExpiry: string | null = null

function load(): void {
  if (memoryToken) return
  memoryToken = readString(STORAGE_KEYS.token, 'local') ?? readString(STORAGE_KEYS.token, 'session')
  memoryExpiry =
    readString(STORAGE_KEYS.tokenExpiry, 'local') ?? readString(STORAGE_KEYS.tokenExpiry, 'session')
}

export const tokenStore = {
  get(): string | null {
    load()
    if (memoryToken && this.isExpired()) {
      this.clear()
      return null
    }
    return memoryToken
  },

  set(token: string, expiresAt: string | null, remember: boolean): void {
    this.clear()
    memoryToken = token
    memoryExpiry = expiresAt
    const kind = remember ? 'local' : 'session'
    writeString(STORAGE_KEYS.token, token, kind)
    if (expiresAt) writeString(STORAGE_KEYS.tokenExpiry, expiresAt, kind)
  },

  isExpired(): boolean {
    load()
    return !!memoryExpiry && new Date(memoryExpiry).getTime() <= Date.now()
  },

  clear(): void {
    memoryToken = null
    memoryExpiry = null
    for (const kind of ['local', 'session'] as const) {
      removeKey(STORAGE_KEYS.token, kind)
      removeKey(STORAGE_KEYS.tokenExpiry, kind)
    }
  },
}
