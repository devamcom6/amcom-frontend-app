import { reactive, watch } from 'vue'
import { readJson, removeKey, writeJson } from '@/utils/storage'

/**
 * Persists in-progress checkout choices to sessionStorage so a refresh, a login
 * redirect or the Paystack round-trip doesn't lose the customer's selection.
 * Contains no sensitive data (plot ids, tenure, amount only).
 */
export function useCheckoutDraft<T extends object>(key: string, initial: T) {
  const storageKey = `amcom.checkout.${key}`
  const state = reactive({ ...initial, ...(readJson<Partial<T>>(storageKey, 'session') ?? {}) }) as T
  watch(state, (v) => writeJson(storageKey, v, 'session'), { deep: true })
  const clear = () => removeKey(storageKey, 'session')
  return { draft: state, clear }
}
