<script setup lang="ts">
import PositionDetail from '@/components/dashboard/PositionDetail.vue'
import { useAsync } from '@/composables/useAsync'
import { buybackService } from '@/services/api'

const props = defineProps<{ id: number }>()
const { data, loading, error, execute } = useAsync(() => buybackService.position(props.id), { watch: [() => props.id] })
</script>

<template>
  <PositionDetail :position="data" :loading="loading" :error="error" fallback="/dashboard/buyback" @retry="execute" />
</template>
