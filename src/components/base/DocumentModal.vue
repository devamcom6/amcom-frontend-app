<script setup lang="ts">
import { ref, watch } from 'vue'
import AppButton from './AppButton.vue'
import AppModal from './AppModal.vue'
import AppSkeleton from './AppSkeleton.vue'
import { loadDocxHtml } from '@/utils/docx'

/** Shows a Word document (e.g. Terms of Service) in a readable dialog, with a download fallback. */
const props = withDefaults(defineProps<{ url: string; title?: string }>(), { title: 'Terms of Service' })
const open = defineModel<boolean>('open', { default: false })

const html = ref('')
const loading = ref(false)
const failed = ref(false)

async function load() {
  loading.value = true
  failed.value = false
  try {
    html.value = await loadDocxHtml(props.url)
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

watch(
  [open, () => props.url],
  ([isOpen]) => {
    if (isOpen && (!html.value || failed.value)) void load()
  },
  { immediate: true },
)
watch(
  () => props.url,
  () => (html.value = ''),
)
</script>

<template>
  <AppModal v-model:open="open" :title="title" size="lg">
    <div class="doc" aria-live="polite" :aria-busy="loading">
      <template v-if="loading && !html">
        <AppSkeleton height="22px" width="70%" />
        <AppSkeleton :lines="10" />
      </template>
      <div v-else-if="failed" class="doc__error">
        <p>We couldn't display the document here.</p>
        <p>
          <a :href="url" target="_blank" rel="noopener noreferrer">Download it to read</a>, or
          <button type="button" class="doc__retry" @click="load">try again</button>.
        </p>
      </div>
      <!-- eslint-disable-next-line vue/no-v-html -- converted from .docx and sanitised (allow-list) -->
      <div v-else class="doc__body" v-html="html" />
    </div>

    <template #footer>
      <div class="doc__actions">
        <AppButton variant="outline" :href="url" target="_blank" rel="noopener noreferrer" icon-left="download">Download</AppButton>
        <AppButton @click="open = false">Close</AppButton>
      </div>
    </template>
  </AppModal>
</template>

<style scoped>
.doc {
  display: grid;
  gap: 12px;
}

.doc__body {
  font-size: var(--text-sm);
  line-height: 1.75;
  color: var(--color-body);
}

.doc__body :deep(h1),
.doc__body :deep(h2),
.doc__body :deep(h3) {
  margin: 28px 0 10px;
  font-size: var(--text-base);
  font-weight: 700;
  line-height: 1.4;
  color: var(--color-ink);
}

.doc__body :deep(> :first-child) {
  margin-top: 0;
}

.doc__body :deep(p) {
  margin: 0 0 12px;
}

.doc__body :deep(ul),
.doc__body :deep(ol) {
  margin: 0 0 12px;
  padding-left: 1.25em;
}

.doc__body :deep(li) {
  margin-bottom: 10px;
}

.doc__body :deep(li.is-numbered) {
  list-style: none;
  margin-left: -1.25em;
}

.doc__body :deep(strong) {
  color: var(--color-ink);
}

.doc__body :deep(table) {
  width: 100%;
  margin: 0 0 12px;
  border-collapse: collapse;
}

.doc__body :deep(td),
.doc__body :deep(th) {
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  vertical-align: top;
}

.doc__error {
  display: grid;
  gap: 8px;
  color: var(--color-body);
}

.doc__error a,
.doc__retry {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: underline;
}

.doc__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 767px) {
  .doc__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
</style>
