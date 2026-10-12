import type { NavigationGuardWithThis, RouteLocationNormalized, Router } from 'vue-router'
import { config } from '@/config/env'
import { useAuthStore } from '@/stores/auth'

/**
 * Client-side access control. This is a UX layer only — Laravel independently
 * authorises every request, so a tampered client gains nothing.
 */
export const accessGuard: NavigationGuardWithThis<undefined> = async (to) => {
  const auth = useAuthStore()
  await auth.init()

  // Merge meta from parent records (layout routes carry shared requirements).
  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth)
  const guestOnly = to.matched.some((r) => r.meta.guestOnly)
  const allowUnverified = to.matched.some((r) => r.meta.allowUnverified)
  const roles = to.matched.flatMap((r) => r.meta.roles ?? [])
  const permissions = to.matched.flatMap((r) => r.meta.permissions ?? [])

  if (guestOnly && auth.isAuthenticated) {
    return auth.homeRoute()
  }

  if (!requiresAuth) return true

  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (!auth.emailVerified && !allowUnverified) {
    return { name: 'verify-email', query: { redirect: to.fullPath } }
  }

  if (roles.length) {
    // Every route level that declares roles must be satisfied.
    const levels = to.matched.filter((r) => r.meta.roles?.length)
    const allowed = levels.every((r) => auth.hasRole(...(r.meta.roles ?? [])))
    if (!allowed) {
      // Admins landing on customer areas go to their console instead of a dead end.
      if (auth.isAdmin && roles.includes('user') && !roles.some((r) => r !== 'user')) return { name: 'admin-dashboard' }
      return { name: 'forbidden', query: { from: to.fullPath } }
    }
  }

  if (permissions.length && !auth.can(permissions)) {
    return { name: 'forbidden', query: { from: to.fullPath } }
  }

  return true
}

export function setDocumentTitle(to: RouteLocationNormalized) {
  const title = [...to.matched].reverse().find((r) => r.meta.title)?.meta.title
  document.title = title ? `${title} | ${config.appName}` : config.appName
}

export function installGuards(router: Router) {
  router.beforeEach(accessGuard)
  router.afterEach((to) => setDocumentTitle(to))
}
