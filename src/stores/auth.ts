import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ADMIN_ROLES } from '@/constants/access'
import { authService, isTwoFactorChallenge } from '@/services/api'
import { tokenStore } from '@/services/http/token'
import type {
  AuthSession,
  AuthUser,
  LoginPayload,
  Permission,
  RegisterPayload,
  Role,
  TwoFactorChallenge,
} from '@/types'
import { STORAGE_KEYS, readString, removeKey, writeString } from '@/utils/storage'

/**
 * Centralised authentication state.
 *
 * The role/permissions held here only drive what the UI shows. Every protected
 * endpoint is independently authorised by Laravel, and the user object is
 * always re-fetched from `/auth/me` on boot — never trusted from storage.
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const initialized = ref(false)
  let initPromise: Promise<void> | null = null

  const isAuthenticated = computed(() => !!user.value)
  const role = computed<Role | null>(() => user.value?.role ?? null)
  const isAdmin = computed(() => !!role.value && ADMIN_ROLES.includes(role.value))
  const isSuperAdmin = computed(() => role.value === 'super_admin')
  const emailVerified = computed(() => !!user.value?.email_verified_at)
  const displayName = computed(() => {
    const u = user.value
    if (!u) return ''
    return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.name || u.email
  })

  function hasRole(...roles: Role[]): boolean {
    return !!role.value && roles.includes(role.value)
  }

  function can(permission: Permission | Permission[]): boolean {
    const perms = user.value?.permissions ?? []
    const required = Array.isArray(permission) ? permission : [permission]
    return required.every((p) => perms.includes(p))
  }

  function canAny(permissions: Permission[]): boolean {
    const perms = user.value?.permissions ?? []
    return permissions.some((p) => perms.includes(p))
  }

  function applySession(session: AuthSession, remember: boolean) {
    tokenStore.set(session.token, session.expires_at, remember)
    user.value = session.user
  }

  /** Restores the session on app start by asking the API who we are. */
  function init(): Promise<void> {
    if (initPromise) return initPromise
    initPromise = (async () => {
      if (tokenStore.get()) {
        try {
          user.value = await authService.me()
        } catch {
          tokenStore.clear()
          user.value = null
        }
      }
      initialized.value = true
    })()
    return initPromise
  }

  async function refreshUser(): Promise<AuthUser | null> {
    if (!tokenStore.get()) return null
    try {
      user.value = await authService.me()
    } catch {
      /* handled by the HTTP layer (401 → session:expired) */
    }
    return user.value
  }

  async function login(payload: LoginPayload): Promise<AuthUser | TwoFactorChallenge> {
    const result = await authService.login(payload)
    if (isTwoFactorChallenge(result)) return result
    applySession(result, !!payload.remember)
    return result.user
  }

  async function register(payload: RegisterPayload): Promise<AuthUser> {
    const session = await authService.register(payload)
    applySession(session, false)
    writeString(STORAGE_KEYS.pendingEmail, session.user.email, 'session')
    return session.user
  }

  async function verifyEmail(code: string): Promise<AuthUser> {
    user.value = await authService.verifyEmail({ code })
    removeKey(STORAGE_KEYS.pendingEmail, 'session')
    return user.value
  }

  async function logout(): Promise<void> {
    try {
      if (tokenStore.get()) await authService.logout()
    } finally {
      clearSession()
    }
  }

  /** Local-only teardown (used after 401s, account deletion, etc.). */
  function clearSession() {
    tokenStore.clear()
    user.value = null
  }

  function patchUser(partial: Partial<AuthUser>) {
    if (user.value) user.value = { ...user.value, ...partial }
  }

  const pendingEmail = computed(() => user.value?.email ?? readString(STORAGE_KEYS.pendingEmail, 'session'))

  /** Where to send someone right after login. */
  function homeRoute(): string {
    if (isAdmin.value) return '/admin'
    return '/dashboard'
  }

  return {
    user,
    initialized,
    isAuthenticated,
    role,
    isAdmin,
    isSuperAdmin,
    emailVerified,
    displayName,
    pendingEmail,
    hasRole,
    can,
    canAny,
    init,
    refreshUser,
    login,
    register,
    verifyEmail,
    logout,
    clearSession,
    patchUser,
    applySession,
    homeRoute,
  }
})
