<script setup lang="ts">
import AppAccordion from '@/components/base/AppAccordion.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import { useAsync } from '@/composables/useAsync'
import { contentService } from '@/services/api'
import type { FaqProduct } from '@/types'

/** FAQs are CMS-managed (admin → Content) and fetched per product. */
const props = defineProps<{ product: FaqProduct }>()
const { data, loading, error, execute } = useAsync(() => contentService.faqs(props.product))
</script>

<template>
  <section id="faqs" class="faq section" aria-labelledby="faq-title">
    <div class="container">
      <h2 id="faq-title" class="section-title section-title--forest">Frequently Asked Questions</h2>
      <div class="faq__body">
        <div v-if="loading && !data" class="faq__loading">
          <AppSkeleton v-for="i in 5" :key="i" height="52px" />
        </div>
        <AppErrorState v-else-if="error" :error="error" compact @retry="execute" />
        <AppAccordion v-else-if="data?.length" :items="data" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.faq__body {
  max-width: 1040px;
  margin: 40px auto 0;
}

.faq__loading {
  display: grid;
  gap: 16px;
}

@media (max-width: 767px) {
  .faq__body {
    margin-top: 24px;
  }
}
</style>
