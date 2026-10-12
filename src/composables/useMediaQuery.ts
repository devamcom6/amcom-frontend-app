import { onScopeDispose, ref } from 'vue'

export function useMediaQuery(query: string) {
  const mql = typeof window !== 'undefined' ? window.matchMedia(query) : null
  const matches = ref(mql?.matches ?? false)
  const update = (e: MediaQueryListEvent) => (matches.value = e.matches)
  mql?.addEventListener('change', update)
  onScopeDispose(() => mql?.removeEventListener('change', update))
  return matches
}

/** Matches the mobile designs (≤ 767px). */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)')
