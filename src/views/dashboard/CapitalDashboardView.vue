<script setup lang="ts">
import PortfolioOverview from '@/components/dashboard/PortfolioOverview.vue'
import { useAsync } from '@/composables/useAsync'
import { capitalService } from '@/services/api'

const { data, loading, error, execute } = useAsync(() => capitalService.portfolio())
</script>

<template>
  <PortfolioOverview :data="data" :loading="loading" :error="error" product="capital" @retry="execute" />
</template>
