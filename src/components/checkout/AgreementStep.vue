<script setup lang="ts">
import { computed, ref } from 'vue'
import AppAlert from '@/components/base/AppAlert.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppCheckbox from '@/components/base/AppCheckbox.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import type { ApiError } from '@/services/http/errors'
import type { Agreement, SignAgreementPayload } from '@/types'

/**
 * Review & sign step. Shows the agreement (served by Laravel as a signed PDF URL),
 * an acceptance checkbox and the optional typed digital signature.
 */
const props = defineProps<{
  agreement: Agreement | undefined
  loading: boolean
  error: ApiError | null
  submitting: boolean
  legalName: string
}>()
const emit = defineEmits<{ submit: [SignAgreementPayload]; retry: [] }>()

const accepted = ref(false)
const useTyped = ref(false)
const typedName = ref(props.legalName)
const zoom = ref(100)
const page = ref(1)
const touched = ref(false)

const acceptError = computed(() => (touched.value && !accepted.value ? 'Please accept the agreement to continue.' : null))
const nameError = computed(() =>
  touched.value && useTyped.value && typedName.value.trim().split(/\s+/).length < 2 ? 'Enter your full legal name (first and last name).' : null,
)

function submit() {
  touched.value = true
  if (!accepted.value || nameError.value) return
  emit('submit', { accepted: true, typed_signature_name: useTyped.value ? typedName.value.trim() : null })
}

function print() {
  if (props.agreement) window.open(props.agreement.document_url, '_blank', 'noopener')?.print?.()
}
</script>

<template>
  <div class="agreement">
    <div class="viewer">
      <div class="viewer__tabs">
        <span class="viewer__tab">{{ agreement?.title ?? 'Agreement' }}</span>
        <a v-if="agreement" :href="agreement.document_url" target="_blank" rel="noopener" class="viewer__open">
          Open in new tab <AppIcon name="external-link" :size="18" />
        </a>
      </div>
      <div class="viewer__toolbar" role="toolbar" aria-label="Document controls">
        <span class="viewer__pages">
          <AppIcon name="menu" :size="18" />
          <span class="viewer__page">{{ page }}</span> / {{ agreement?.page_count ?? '–' }}
        </span>
        <span class="viewer__group">
          <button type="button" aria-label="Zoom out" @click="zoom = Math.max(60, zoom - 10)"><AppIcon name="minus" :size="18" /></button>
          <button type="button" aria-label="Zoom in" @click="zoom = Math.min(160, zoom + 10)"><AppIcon name="plus" :size="18" /></button>
        </span>
        <span class="viewer__group hide-mobile">
          <button type="button" aria-label="Previous page" :disabled="page <= 1" @click="page--"><AppIcon name="undo" :size="18" /></button>
          <button type="button" aria-label="Next page" :disabled="page >= (agreement?.page_count ?? 1)" @click="page++"><AppIcon name="redo" :size="18" /></button>
        </span>
        <span class="viewer__group">
          <a v-if="agreement" :href="agreement.document_url" download aria-label="Download agreement"><AppIcon name="download" :size="18" /></a>
          <button type="button" aria-label="Print agreement" class="hide-mobile" @click="print"><AppIcon name="print" :size="18" /></button>
        </span>
      </div>
      <div class="viewer__doc" tabindex="0" aria-label="Agreement text">
        <AppSkeleton v-if="loading && !agreement" :lines="8" />
        <AppErrorState v-else-if="error" :error="error" compact @retry="emit('retry')" />
        <article v-else-if="agreement" class="viewer__paper" :style="{ fontSize: `${(zoom / 100) * 0.875}rem` }">
          <h3 class="viewer__doc-title">{{ agreement.title }}</h3>
          <p v-for="(para, i) in agreement.preview_paragraphs" :key="i">{{ para }}</p>
        </article>
      </div>
    </div>

    <AppCheckbox v-model="accepted" class="agreement__accept" :error="acceptError">
      Yes, I have read and I accept and agree to the Amcom {{ agreement?.title ?? 'Agreement' }}.
    </AppCheckbox>

    <div class="agreement__sig">
      <h3 class="agreement__sig-title">Digital Signature</h3>
      <p class="agreement__sig-text">
        If you are unable to provide a handwritten signature, you may opt to use your full legal name as a digital signature. By
        selecting this option, you acknowledge that your typed name will serve as your legally binding electronic signature in
        accordance with applicable electronic signature laws.
      </p>
      <AppCheckbox v-model="useTyped">I choose to use my full legal name as my digital signature in place of a handwritten signature.</AppCheckbox>
      <Transition name="slide-up">
        <AppInput v-if="useTyped" v-model="typedName" class="agreement__name" label="Full legal name" autocomplete="name" :error="nameError" />
      </Transition>
    </div>

    <AppAlert v-if="agreement?.signed_at" tone="success">You signed this agreement. Continue to payment.</AppAlert>

    <div class="agreement__actions">
      <AppButton size="lg" :loading="submitting" :disabled="!agreement" @click="submit">Submit and continue</AppButton>
    </div>
  </div>
</template>

<style scoped>
.agreement {
  display: grid;
  gap: 28px;
}

.viewer {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.viewer__tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.viewer__tab {
  padding: 16px 24px;
  border-bottom: 2px solid var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.viewer__open {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  font-size: var(--text-sm);
  color: var(--color-primary);
}

.viewer__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 18px;
  background: #333639;
  color: #f1f1f1;
  font-size: var(--text-sm);
}

.viewer__pages,
.viewer__group {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.viewer__page {
  padding: 2px 8px;
  border-radius: 3px;
  background: #4a4d51;
}

.viewer__group button,
.viewer__group a {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  color: inherit;
}

.viewer__group button:hover,
.viewer__group a:hover {
  background: rgba(255, 255, 255, 0.12);
}

.viewer__group button:disabled {
  opacity: 0.4;
}

.viewer__doc {
  height: 408px;
  padding: 32px 40px;
  overflow: auto;
  background: var(--color-bg);
}

.viewer__paper {
  display: grid;
  gap: 16px;
  line-height: 1.6;
  text-align: justify;
  color: var(--color-ink);
}

.viewer__doc-title {
  font-size: 1.15em;
  font-weight: 500;
  text-align: center;
}

.agreement__sig {
  display: grid;
  gap: 12px;
  padding-top: 28px;
  border-top: 1px solid var(--color-border);
}

.agreement__sig-title {
  font-size: var(--text-sm);
  font-weight: 500;
}

.agreement__sig-text {
  font-size: var(--text-xs);
  line-height: 1.7;
  color: var(--color-muted);
}

.agreement__name {
  max-width: 420px;
}

.agreement__actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 767px) {
  .viewer__doc {
    height: 320px;
    padding: 20px 16px;
  }
  .viewer__tab {
    padding: 12px 14px;
    font-size: var(--text-sm);
  }
  .agreement__actions > * {
    flex: 1;
  }
}
</style>
