<script setup lang="ts">
import { computed, watch } from 'vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import { config } from '@/config/env'
import { useAsync } from '@/composables/useAsync'
import { contentService } from '@/services/api'
import { formatDate } from '@/utils/format'
import { sanitizeHtml } from '@/utils/sanitize'

const props = defineProps<{ slug: string }>()
const { data: page, loading, error, execute } = useAsync(() => contentService.page(props.slug), {
  watch: [() => props.slug],
})
const safeHtml = computed(() => (page.value ? sanitizeHtml(page.value.body_html) : ''))
watch(page, (p) => p && (document.title = `${p.title} | ${config.appName}`))
</script>

<template>
  <article class="legal section">
    <div class="container legal__inner">
      <template v-if="loading && !page">
        <AppSkeleton height="40px" width="50%" />
        <AppSkeleton :lines="8" />
      </template>
      <AppErrorState v-else-if="error" :error="error" @retry="execute" />
      <template v-else-if="page">
        <h1 class="legal__title display">{{ page.title }}</h1>
        <p class="legal__updated">Last updated {{ formatDate(page.updated_at) }}</p>
        <!-- eslint-disable-next-line vue/no-v-html -- sanitised CMS HTML -->
        <div class="legal__body" v-html="safeHtml" />
      </template>
    </div>
  </article>
</template>

<style scoped>
.legal__inner {
  max-width: 820px;
  display: grid;
  gap: 16px;
}

.legal__title {
  font-size: clamp(2rem, 1.4rem + 2vw, 3rem);
}

.legal__updated {
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.legal__body {
  margin-top: 16px;
  line-height: 1.75;
  color: var(--color-body);
}

.legal__body :deep(h2) {
  margin: 32px 0 12px;
  font-size: var(--text-xl);
}

.legal__body :deep(h3) {
  margin: 24px 0 8px;
  font-size: var(--text-lg);
}

.legal__body :deep(p),
.legal__body :deep(ul) {
  margin: 0 0 12px;
}

.legal__body :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
}
</style>
