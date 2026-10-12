<script setup lang="ts">
import AppIcon from '@/components/base/AppIcon.vue'
import AppSpinner from '@/components/base/AppSpinner.vue'
import type { IconName } from '@/components/base/icons'
import { useDocumentDownload } from '@/composables/useDocumentDownload'
import type { DocumentFile, DocumentType } from '@/types'
import { formatDate, formatFileSize } from '@/utils/format'

/**
 * Private documents (receipts, contracts, titles). Each download requests a short-lived
 * signed URL from Laravel — URLs are never embedded in list payloads.
 */
withDefaults(
  defineProps<{
    documents: DocumentFile[]
    title?: string
    description?: string
    variant?: 'card' | 'table' | 'compact'
  }>(),
  { title: 'Documents', variant: 'card' },
)

const { download, downloadingId } = useDocumentDownload()

const ICON: Partial<Record<DocumentType, IconName>> = {
  payment_receipt: 'receipt',
  investment_contract: 'file-signature',
  buyback_agreement: 'file-signature',
  investment_certificate: 'badge-check',
}

const STATUS_TEXT: Record<DocumentFile['status'], string> = {
  available: 'Download',
  pending_review: 'Download',
  not_signed: 'Not signed yet',
  issued_after_signing: 'Issued after signing',
}

function meta(doc: DocumentFile) {
  const parts = [formatFileSize(doc.size_bytes), doc.uploaded_at ? `Uploaded ${formatDate(doc.uploaded_at)}` : null].filter((p) => p && p !== '—')
  return parts.join(' • ')
}
</script>

<template>
  <section class="docs" :class="`docs--${variant}`" aria-labelledby="docs-title">
    <h2 id="docs-title" class="docs__title">{{ title }}</h2>
    <p v-if="description" class="docs__desc">{{ description }}</p>
    <p v-if="!documents.length" class="docs__empty">No documents yet. They will appear here as soon as they are issued.</p>
    <ul v-else class="docs__list" role="list">
      <li v-for="doc in documents" :key="doc.id" class="docs__item">
        <span v-if="variant !== 'table'" class="docs__file" aria-hidden="true" />
        <AppIcon v-else :name="ICON[doc.type] ?? 'file-text'" :size="20" class="docs__icon" />
        <div class="docs__text">
          <span class="docs__name">
            {{ doc.name }}<template v-if="doc.status === 'pending_review'"> – Pending Review</template>
          </span>
          <span v-if="variant !== 'table' && meta(doc)" class="docs__meta">{{ meta(doc) }}</span>
        </div>
        <button
          v-if="doc.status === 'available' || doc.status === 'pending_review'"
          type="button"
          class="docs__action"
          :class="{ 'docs__action--text': variant !== 'card' }"
          :aria-label="`Download ${doc.name}`"
          :disabled="downloadingId === doc.id"
          @click="download(doc)"
        >
          <AppSpinner v-if="downloadingId === doc.id" :size="14" />
          <template v-else-if="variant === 'card'"><AppIcon name="download" :size="18" /></template>
          <template v-else>Download</template>
        </button>
        <span v-else class="docs__state" :class="`docs__state--${doc.status}`">{{ STATUS_TEXT[doc.status] }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.docs {
  padding: 24px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
}

.docs__title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-ink);
}

.docs__desc {
  margin-top: 4px;
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.docs__empty {
  margin-top: 16px;
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.docs__list {
  margin-top: 16px;
}

.docs__item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.docs__file {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  background: var(--color-success-bg);
  flex-shrink: 0;
  position: relative;
}

.docs__file::after {
  content: '';
  position: absolute;
  inset: 9px 10px;
  border-radius: 2px;
  background: var(--color-lime);
  clip-path: polygon(0 0, 70% 0, 100% 30%, 100% 100%, 0 100%);
}

.docs__icon {
  color: var(--color-body);
}

.docs__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.docs__name {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-ink);
}

.docs__meta {
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.docs__action {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: #f3f4f6;
  color: var(--color-ink);
}

.docs__action:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.docs__action--text {
  width: auto;
  height: auto;
  background: none;
  font-size: var(--text-sm);
  font-weight: 500;
  color: #1d4ed8;
}

.docs__state {
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.docs__state--not_signed {
  color: var(--color-warning);
}

/* Table variant (capital investment detail) */
.docs--table .docs__list {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.docs--table .docs__item:last-child {
  border-bottom: 0;
}

/* Compact variant (mobile position detail) */
.docs--compact .docs__item {
  padding: 8px 0;
  border-bottom: 0;
}

.docs--compact .docs__file {
  display: none;
}

.docs--compact .docs__name {
  font-weight: 400;
  color: var(--color-body);
}

.docs--compact .docs__action--text {
  color: var(--color-success);
  font-size: var(--text-xs);
}

@media (max-width: 767px) {
  .docs {
    padding: 16px;
  }

  .docs__item {
    padding: 12px 0;
  }

  .docs__file {
    width: 32px;
    height: 32px;
    background: #b9d6cc;
  }

  .docs__file::after {
    display: none;
  }
}
</style>
