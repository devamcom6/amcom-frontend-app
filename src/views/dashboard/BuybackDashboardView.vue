<script setup lang="ts">
import PortfolioOverview from '@/components/dashboard/PortfolioOverview.vue'
import { useAsync } from '@/composables/useAsync'
import { buybackService } from '@/services/api'

const { data, loading, error, execute } = useAsync(() => buybackService.portfolio())
</script>

<template>
  <PortfolioOverview :data="data" :loading="loading" :error="error" product="buyback" @retry="execute" />
</template>
