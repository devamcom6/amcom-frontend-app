/**
 * Safe wrappers around Web Storage (private mode / disabled storage throw on access).
 */
type StorageKind = 'local' | 'session'

function store(kind: StorageKind): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function readJson<T>(key: string, kind: StorageKind = 'local'): T | null {
  try {
    const raw = store(kind)?.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeJson(key: string, value: unknown, kind: StorageKind = 'local'): void {
  try {
    store(kind)?.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable — non-critical */
  }
}

export function readString(key: string, kind: StorageKind = 'local'): string | null {
  try {
    return store(kind)?.getItem(key) ?? null
  } catch {
    return null
  }
}

export function writeString(key: string, value: string, kind: StorageKind = 'local'): void {
  try {
    store(kind)?.setItem(key, value)
  } catch {
    /* ignore */
  }
}

export function removeKey(key: string, kind: StorageKind = 'local'): void {
  try {
    store(kind)?.removeItem(key)
  } catch {
    /* ignore */
  }
}

export const STORAGE_KEYS = {
  token: 'amcom.auth.token',
  tokenExpiry: 'amcom.auth.expires_at',
  pendingEmail: 'amcom.auth.pending_email',
  onboardingSkipped: 'amcom.onboarding.skipped',
  checkoutDraft: 'amcom.checkout.draft',
  listingDraft: 'amcom.listing.draft',
  mockDb: 'amcom.mock.db',
} as const
