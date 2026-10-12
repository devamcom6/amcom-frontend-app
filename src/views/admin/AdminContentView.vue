<script setup lang="ts">
import { ref } from 'vue'
import AdminToolbar from '@/components/admin/AdminToolbar.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppConfirmDialog from '@/components/base/AppConfirmDialog.vue'
import AppDataTable, { type Column } from '@/components/base/AppDataTable.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppModal from '@/components/base/AppModal.vue'
import AppPagination from '@/components/base/AppPagination.vue'
import AppSelect from '@/components/base/AppSelect.vue'
import AppTabs from '@/components/base/AppTabs.vue'
import AppTextarea from '@/components/base/AppTextarea.vue'
import AppToggle from '@/components/base/AppToggle.vue'
import { useForm } from '@/composables/useForm'
import { useResourceList } from '@/composables/useResourceList'
import { adminService } from '@/services/api'
import { useUiStore } from '@/stores/ui'
import type { FaqItem, Testimonial } from '@/types'
import { humanize } from '@/utils/format'
import { minLength, required } from '@/utils/validators'

const ui = useUiStore()
const tab = ref<'faqs' | 'testimonials'>('faqs')

const PRODUCTS = [
  { value: 'buyback', label: 'Buyback' },
  { value: 'capital_investment', label: 'Capital investment' },
  { value: 'property_management', label: 'Property management' },
  { value: 'general', label: 'General' },
]

const faqs = useResourceList<FaqItem, { product: string }>({ fetcher: (q) => adminService.faqs(q), filters: { product: '' }, syncUrl: false })
const testimonials = useResourceList<Testimonial>({ fetcher: (q) => adminService.testimonials(q), syncUrl: false })

const faqColumns: Column[] = [
  { key: 'question', label: 'Question', primary: true },
  { key: 'product', label: 'Page' },
  { key: 'is_published', label: 'Status' },
]
const tColumns: Column[] = [
  { key: 'author_name', label: 'Author', primary: true },
  { key: 'quote', label: 'Quote' },
  { key: 'is_published', label: 'Published' },
]

/* FAQ editor */
const editorOpen = ref(false)
const editingId = ref<number | null>(null)
const form = useForm(
  { product: 'buyback' as FaqItem['product'], question: '', answer: '', is_published: true },
  { rules: { question: [required('Enter the question.'), minLength(5)], answer: [required('Enter the answer.'), minLength(5)] } },
)

function edit(f?: FaqItem) {
  editingId.value = f?.id ?? null
  form.reset(f ? { product: f.product, question: f.question, answer: f.answer, is_published: f.is_published } : undefined)
  editorOpen.value = true
}

async function save() {
  try {
    const saved = await form.submit(() => adminService.saveFaq({ id: editingId.value ?? undefined, ...form.values }))
    if (saved) {
      editorOpen.value = false
      ui.success(editingId.value ? 'FAQ updated' : 'FAQ added')
      await faqs.refresh()
    }
  } catch (e) {
    ui.apiError(e)
  }
}

const deleting = ref<FaqItem | null>(null)
const deletingBusy = ref(false)
async function remove() {
  if (!deleting.value) return
  deletingBusy.value = true
  try {
    await adminService.deleteFaq(deleting.value.id)
    deleting.value = null
    ui.success('FAQ deleted')
    await faqs.refresh()
  } catch (e) {
    ui.apiError(e)
  } finally {
    deletingBusy.value = false
  }
}

async function togglePublished(t: Testimonial, v: boolean) {
  try {
    await adminService.setTestimonialPublished(t.id, v)
    t.is_published = v
  } catch (e) {
    ui.apiError(e)
  }
}
</script>

<template>
  <div>
    <AppTabs
      v-model="tab"
      label="Content type"
      id-prefix="content"
      :tabs="[
        { value: 'faqs', label: 'FAQs' },
        { value: 'testimonials', label: 'Testimonials' },
      ]"
      class="tabs"
    />

    <section v-if="tab === 'faqs'" role="tabpanel" aria-labelledby="content-faqs">
      <AdminToolbar v-model:search="faqs.search.value" placeholder="Search FAQs">
        <label><span class="sr-only">Page</span>
          <select v-model="faqs.filters.product"><option value="">All pages</option><option v-for="p in PRODUCTS" :key="p.value" :value="p.value">{{ p.label }}</option></select>
        </label>
        <AppButton icon-left="plus" size="sm" @click="edit()">Add FAQ</AppButton>
      </AdminToolbar>
      <AppErrorState v-if="faqs.error.value" :error="faqs.error.value" @retry="faqs.refresh" />
      <template v-else>
        <AppDataTable :columns="faqColumns" :rows="faqs.items.value" :loading="faqs.loading.value" caption="FAQs">
          <template #cell-question="{ row }"><span class="cell"><strong>{{ row.question }}</strong><small>{{ row.answer }}</small></span></template>
          <template #cell-product="{ row }">{{ humanize(row.product) }}</template>
          <template #cell-is_published="{ row }">{{ row.is_published ? 'Published' : 'Draft' }}</template>
          <template #actions="{ row }">
            <AppButton size="sm" variant="secondary" @click="edit(row)">Edit</AppButton>
            <AppButton size="sm" variant="ghost" class="danger" @click="deleting = row">Delete</AppButton>
          </template>
        </AppDataTable>
        <AppPagination v-model:page="faqs.page.value" :meta="faqs.meta.value" label="FAQs" />
      </template>
    </section>

    <section v-else role="tabpanel" aria-labelledby="content-testimonials">
      <AppErrorState v-if="testimonials.error.value" :error="testimonials.error.value" @retry="testimonials.refresh" />
      <AppDataTable v-else :columns="tColumns" :rows="testimonials.items.value" :loading="testimonials.loading.value" caption="Testimonials">
        <template #cell-author_name="{ row }"><span class="cell"><strong>{{ row.author_name }}</strong><small>{{ row.author_title }}</small></span></template>
        <template #cell-quote="{ row }"><span class="quote">“{{ row.quote }}”</span></template>
        <template #cell-is_published="{ row }">
          <AppToggle :model-value="row.is_published" :label="row.is_published ? 'Shown on home page' : 'Hidden'" @update:model-value="togglePublished(row, $event)" />
        </template>
      </AppDataTable>
    </section>

    <AppModal v-model:open="editorOpen" :title="editingId ? 'Edit FAQ' : 'Add FAQ'" size="md" :persistent="form.submitting">
      <form id="faq-form" class="stack" novalidate @submit.prevent="save">
        <AppSelect v-model="form.values.product" label="Show on page" :options="PRODUCTS" />
        <AppInput v-model="form.values.question" label="Question" :error="form.errors.question" @blur="form.touch('question')" />
        <AppTextarea v-model="form.values.answer" label="Answer" :rows="5" :maxlength="1500" :error="form.errors.answer" @blur="form.touch('answer')" />
        <AppToggle v-model="form.values.is_published" label="Published" description="Visible on the public website" />
      </form>
      <template #footer>
        <AppButton type="submit" form="faq-form" block :loading="form.submitting">Save FAQ</AppButton>
      </template>
    </AppModal>

    <AppConfirmDialog
      :open="!!deleting"
      title="Delete this FAQ?"
      :message="deleting?.question"
      tone="danger"
      confirm-label="Delete"
      :loading="deletingBusy"
      @update:open="(v) => !v && (deleting = null)"
      @confirm="remove"
    />
  </div>
</template>

<style scoped>
.tabs {
  margin-bottom: 20px;
}

.cell {
  display: flex;
  flex-direction: column;
  max-width: 560px;
}

.cell small {
  font-size: var(--text-xs);
  color: var(--color-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quote {
  display: -webkit-box;
  max-width: 480px;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--color-body);
}

.danger {
  --btn-fg: var(--color-danger);
}

.stack {
  display: grid;
  gap: 16px;
}
</style>
