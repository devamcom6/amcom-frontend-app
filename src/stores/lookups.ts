import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ID_TYPE_OPTIONS, RELATIONSHIP_OPTIONS } from '@/constants/options'
import { contentService } from '@/services/api'
import type { Lookups, Option } from '@/types'

/** Reference data (states, LGAs, banks, ID types…) fetched once and cached for the session. */
export const useLookupStore = defineStore('lookups', () => {
  const data = ref<Lookups | null>(null)
  const loading = ref(false)
  let pending: Promise<void> | null = null

  function ensure(): Promise<void> {
    if (data.value) return Promise.resolve()
    if (pending) return pending
    loading.value = true
    pending = contentService
      .lookups()
      .then((res) => {
        data.value = res
      })
      .catch(() => {
        /* Forms fall back to static options below. */
      })
      .finally(() => {
        loading.value = false
        pending = null
      })
    return pending
  }

  const toOptions = (values: string[]): Option[] => values.map((v) => ({ value: v, label: v }))

  const countries = computed(() => toOptions(data.value?.countries ?? ['Nigeria']))
  const states = computed(() => toOptions(data.value?.states.map((s) => s.name) ?? []))
  const idTypes = computed<Option[]>(() => data.value?.id_types ?? ID_TYPE_OPTIONS)
  const relationships = computed<Option[]>(() => (data.value ? toOptions(data.value.relationships) : RELATIONSHIP_OPTIONS))
  const banks = computed<Option[]>(() => data.value?.banks.map((b) => ({ value: b.code, label: b.name })) ?? [])
  const propertyLocations = computed(() => data.value?.property_locations ?? [])

  function lgasFor(state: string | null | undefined): Option[] {
    if (!state) return []
    return toOptions(data.value?.states.find((s) => s.name === state)?.lgas ?? [])
  }

  return { data, loading, ensure, countries, states, idTypes, relationships, banks, propertyLocations, lgasFor }
})
