<script setup lang="ts">
import PositionDetail from '@/components/dashboard/PositionDetail.vue'
import { useAsync } from '@/composables/useAsync'
import { capitalService } from '@/services/api'
import { useUiStore } from '@/stores/ui'

const props = defineProps<{ id: number }>()
const ui = useUiStore()
const { data, loading, error, execute } = useAsync(() => capitalService.position(props.id), { watch: [() => props.id] })

async function requestPayout() {
  try {
    data.value = await capitalService.requestPayout(props.id)
    ui.success('Payout requested', "We'll email you once the transfer is on its way.")
  } catch (e) {
    ui.apiError(e)
  }
}
</script>

<template>
  <PositionDetail :position="data" :loading="loading" :error="error" fallback="/dashboard/capital-investment" :on-payout="requestPayout" @retry="execute" />
</template>
