import { onScopeDispose, ref, shallowRef, watch, type Ref, type WatchSource } from 'vue'
import { ApiError, toApiError } from '@/services/http/errors'

interface UseAsyncOptions<T> {
  immediate?: boolean
  /** Re-run when any of these sources change. */
  watch?: WatchSource[]
  initialData?: T
  onError?: (error: ApiError) => void
}

/**
 * Loading / error / data state for a single async resource.
 * Ignores out-of-order responses so fast navigation never shows stale data.
 */
export function useAsync<T>(fn: () => Promise<T>, options: UseAsyncOptions<T> = {}) {
  const data = shallowRef<T | undefined>(options.initialData) as Ref<T | undefined>
  const error = ref<ApiError | null>(null)
  const loading = ref(false)
  const loaded = ref(false)
  let callId = 0
  let disposed = false

  async function execute(): Promise<T | undefined> {
    const id = ++callId
    loading.value = true
    error.value = null
    try {
      const result = await fn()
      if (id === callId && !disposed) {
        data.value = result
        loaded.value = true
      }
      return result
    } catch (e) {
      const apiError = toApiError(e)
      if (id === callId && !disposed && apiError.kind !== 'cancelled') {
        error.value = apiError
        options.onError?.(apiError)
      }
      return undefined
    } finally {
      if (id === callId) loading.value = false
    }
  }

  if (options.watch?.length) watch(options.watch, () => void execute())
  if (options.immediate !== false) void execute()
  onScopeDispose(() => (disposed = true))

  return { data, error, loading, loaded, execute, refresh: execute }
}
