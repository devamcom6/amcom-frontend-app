<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'

const route = useRoute()
const hideFooter = computed(() => route.matched.some((r) => r.meta.hideFooter))
</script>

<template>
  <SiteHeader />
  <main id="main" class="main" tabindex="-1">
    <RouterView />
  </main>
  <SiteFooter v-if="!hideFooter" />
</template>

<style scoped>
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.main:focus {
  outline: none;
}
</style>
