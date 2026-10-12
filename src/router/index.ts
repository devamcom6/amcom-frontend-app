import { createRouter, createWebHistory } from 'vue-router'
import { installGuards } from './guards'
import { routes } from './routes'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, top: 96, behavior: 'smooth' }
    // Keep scroll position for query-only changes (filters, tabs, pagination).
    if (to.path === from.path) return false
    return { top: 0 }
  },
})

installGuards(router)

// A deploy can invalidate lazily-loaded chunks; reload once to pick up the new build.
router.onError((error, to) => {
  if (/Failed to fetch dynamically imported module|Importing a module script failed/i.test(String(error?.message))) {
    window.location.assign(to.fullPath)
  }
})
