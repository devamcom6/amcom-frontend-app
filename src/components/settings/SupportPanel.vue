<script setup lang="ts">
import AppAlert from '@/components/base/AppAlert.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppSelect from '@/components/base/AppSelect.vue'
import AppTextarea from '@/components/base/AppTextarea.vue'
import { useForm } from '@/composables/useForm'
import { COMPANY } from '@/constants/site'
import { profileService } from '@/services/api'
import { useUiStore } from '@/stores/ui'
import type { SupportTicketPayload } from '@/types'
import { minLength, required } from '@/utils/validators'
import SettingsSection from './SettingsSection.vue'

const ui = useUiStore()
const CATEGORIES = [
  { value: 'account', label: 'Account & login' },
  { value: 'payments', label: 'Payments & receipts' },
  { value: 'investments', label: 'Investments & payouts' },
  { value: 'property', label: 'Listings & properties' },
  { value: 'other', label: 'Something else' },
]

const form = useForm(
  { category: '' as SupportTicketPayload['category'] | '', subject: '', message: '' },
  {
    rules: {
      category: [required('Choose a topic.')],
      subject: [required('Add a subject.')],
      message: [required('Describe how we can help.'), minLength(10, 'Add a little more detail.')],
    },
  },
)

async function submit() {
  try {
    const res = await form.submit(() => profileService.createSupportTicket(form.values as SupportTicketPayload))
    if (res) {
      ui.success('Request received', `Ticket ${res.reference}. We'll reply by email within 24 hours.`)
      form.reset()
    }
  } catch (e) {
    ui.apiError(e)
  }
}
</script>

<template>
  <div>
    <SettingsSection id="help-title" title="Help & Support" description="Our team is available Monday – Saturday, 8am – 6pm WAT.">
      <ul class="channels" role="list">
        <li><AppIcon name="mail" /> <a :href="`mailto:${COMPANY.supportEmail}`">{{ COMPANY.supportEmail }}</a></li>
        <li><AppIcon name="phone" /> <a :href="`tel:${COMPANY.supportPhone.replace(/\s/g, '')}`">{{ COMPANY.supportPhone }}</a></li>
        <li><AppIcon name="help" /> <RouterLink to="/buyback#faqs">Browse frequently asked questions</RouterLink></li>
      </ul>
    </SettingsSection>
    <SettingsSection id="ticket-title" title="Send us a message">
      <form class="stack" novalidate @submit.prevent="submit">
        <AppAlert v-if="form.errors._form" tone="danger">{{ form.errors._form }}</AppAlert>
        <AppSelect v-model="form.values.category" label="Topic" placeholder="Select a topic" :options="CATEGORIES" :error="form.errors.category" />
        <AppInput v-model="form.values.subject" label="Subject" :error="form.errors.subject" @blur="form.touch('subject')" />
        <AppTextarea v-model="form.values.message" label="Message" :rows="5" :maxlength="2000" :error="form.errors.message" @blur="form.touch('message')" />
        <div class="actions"><AppButton type="submit" :loading="form.submitting">Send message</AppButton></div>
      </form>
    </SettingsSection>
  </div>
</template>

<style scoped>
.channels {
  display: grid;
  gap: 14px;
  margin-top: -8px;
}

.channels li {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-body);
}

.channels :deep(svg) {
  color: var(--color-primary);
}

.channels a:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.stack {
  display: grid;
  gap: 18px;
}

.actions {
  display: flex;
  justify-content: flex-end;
}
</style>
