import { computed, reactive, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { toApiError, type ApiError } from '@/services/http/errors'
import type { ListQuery, Paginated, PaginationMeta } from '@/types'

type FilterValue = string | string[] | null

interface Options<F extends Record<string, FilterValue>> {
  fetcher: (query: ListQuery) => Promise<Paginated<unknown>>
  filters?: F
  perPage?: number
  sort?: string
  /** Keep filters/page/search in the URL so lists are shareable and survive refresh. */
  syncUrl?: boolean
}

const EMPTY_META: PaginationMeta = { current_page: 1, per_page: 25, total: 0, last_page: 1, from: null, to: null }

/**
 * Server-driven list state: pagination, search (debounced), filters and sorting.
 * Never loads all records — every change is a new paginated API request.
 */
export function useResourceList<T, F extends Record<string, FilterValue> = Record<string, FilterValue>>(
  options: Options<F>,
) {
  const route = useRoute()
  const router = useRouter()
  const sync = options.syncUrl !== false

  const q = route.query
  const str = (v: unknown) => (typeof v === 'string' ? v : Array.isArray(v) ? String(v[0] ?? '') : '')

  const page = ref(sync ? Number(str(q.page)) || 1 : 1)
  const perPage = ref(sync ? Number(str(q.per_page)) || options.perPage || 25 : options.perPage || 25)
  const search = ref(sync ? str(q.search) : '')
  const sort = ref(sync ? str(q.sort) || options.sort || '' : options.sort || '')
  const filters = reactive({ ...(options.filters ?? {}) }) as F

  if (sync) {
    for (const key of Object.keys(filters)) {
      const raw = q[key]
      if (raw === undefined) continue
      const initial = (options.filters as Record<string, FilterValue> | undefined)?.[key]
      ;(filters as Record<string, FilterValue>)[key] = Array.isArray(initial)
        ? (Array.isArray(raw) ? raw : [raw]).filter((v): v is string => typeof v === 'string')
        : str(raw)
    }
  }

  const items = shallowRef<T[]>([])
  const meta = ref<PaginationMeta>({ ...EMPTY_META, per_page: perPage.value })
  const loading = ref(false)
  const error = ref<ApiError | null>(null)
  const loaded = ref(false)
  let callId = 0

  const query = computed<ListQuery>(() => {
    const out: ListQuery = { page: page.value, per_page: perPage.value }
    if (search.value.trim()) out.search = search.value.trim()
    if (sort.value) out.sort = sort.value
    for (const [k, v] of Object.entries(filters as Record<string, FilterValue>)) {
      if (v === null || v === '' || (Array.isArray(v) && !v.length)) continue
      out[k] = v
    }
    return out
  })

  async function load() {
    const id = ++callId
    loading.value = true
    error.value = null
    try {
      const res = await options.fetcher(query.value)
      if (id !== callId) return
      items.value = res.data as T[]
      meta.value = res.meta
      loaded.value = true
      // Requested page beyond the end (e.g. after deleting the last row) → step back.
      if (res.meta.current_page > res.meta.last_page && res.meta.last_page >= 1) page.value = res.meta.last_page
    } catch (e) {
      if (id === callId) error.value = toApiError(e)
    } finally {
      if (id === callId) loading.value = false
    }
  }

  function writeUrl() {
    if (!sync) return
    const next: LocationQueryRaw = { ...route.query }
    const assign = (key: string, value: unknown, fallback?: unknown) => {
      if (value === undefined || value === null || value === '' || value === fallback || (Array.isArray(value) && !value.length)) {
        delete next[key]
      } else {
        next[key] = value as LocationQueryRaw[string]
      }
    }
    assign('page', page.value, 1)
    assign('per_page', perPage.value, options.perPage || 25)
    assign('search', search.value.trim())
    assign('sort', sort.value, options.sort || '')
    for (const [k, v] of Object.entries(filters as Record<string, FilterValue>)) assign(k, v)
    void router.replace({ query: next })
  }

  let searchTimer: ReturnType<typeof setTimeout> | undefined
  watch(search, () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      if (page.value !== 1) page.value = 1
      else void refresh()
    }, 350)
  })

  watch(
    () => JSON.stringify(filters),
    () => {
      if (page.value !== 1) page.value = 1
      else void refresh()
    },
  )

  watch([page, perPage, sort], () => void refresh())

  async function refresh() {
    writeUrl()
    await load()
  }

  function resetFilters() {
    search.value = ''
    for (const [k, v] of Object.entries(options.filters ?? {})) {
      ;(filters as Record<string, FilterValue>)[k] = Array.isArray(v) ? [] : (v ?? null)
    }
  }

  function toggleSort(field: string) {
    sort.value = sort.value === field ? `-${field}` : sort.value === `-${field}` ? '' : field
  }

  const hasActiveFilters = computed(
    () =>
      !!search.value.trim() ||
      Object.values(filters as Record<string, FilterValue>).some((v) => (Array.isArray(v) ? v.length > 0 : !!v)),
  )

  void load()

  return {
    items,
    meta,
    loading,
    loaded,
    error,
    page,
    perPage,
    search,
    sort,
    filters,
    query,
    hasActiveFilters,
    refresh,
    resetFilters,
    toggleSort,
  }
}
