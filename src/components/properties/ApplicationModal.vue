<script setup lang="ts">
import { ref, watch } from 'vue'
import AppAlert from '@/components/base/AppAlert.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppModal from '@/components/base/AppModal.vue'
import AppSuccessPanel from '@/components/base/AppSuccessPanel.vue'
import AppTextarea from '@/components/base/AppTextarea.vue'
import { useForm } from '@/composables/useForm'
import { propertyService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { PropertyDetail } from '@/types'
import { email, phone, required } from '@/utils/validators'

/** "Start application" — public form; Laravel emails a confirmation (ZeptoMail) on success. */
const props = defineProps<{ property: PropertyDetail }>()
const open = defineModel<boolean>('open', { default: false })
const auth = useAuthStore()
const ui = useUiStore()
const done = ref(false)

const form = useForm(
  { full_name: auth.displayName || '', email: auth.user?.email ?? '', phone: auth.user?.phone ?? '', message: '' },
  {
    rules: {
      full_name: [required('Enter your first and last name.')],
      email: [required('Enter your email address.'), email()],
      phone: [required('Enter your phone number.'), phone()],
      message: [required('Tell us a little about your interest.')],
    },
  },
)

watch(open, (v) => {
  if (v) done.value = false
})

async function submit() {
  try {
    const res = await form.submit(() => propertyService.apply(props.property.slug, form.values))
    if (res) {
      done.value = true
      form.reset({ full_name: form.values.full_name, email: form.values.email, phone: form.values.phone })
    }
  } catch (e) {
    ui.apiError(e)
  }
}
</script>

<template>
  <AppModal v-model:open="open" :title="done ? undefined : 'Application Form'" size="md" :persistent="form.submitting">
    <AppSuccessPanel v-if="done" title="Application Submitted!" heading-level="h2" class="app-success">
      <p>
        Thank you for your interest in buying the following property: <strong>{{ property.title }}</strong>. Your application for this
        property has been received. Our team will review your submission and get back to you within 2-3 business days.
      </p>
      <p class="app-success__email">A confirmation email has been sent to your inbox.</p>
      <template #actions>
        <AppButton size="lg" block to="/properties" @click="open = false">Back to Listings</AppButton>
      </template>
    </AppSuccessPanel>

    <form v-else id="application-form" class="app-form" novalidate @submit.prevent="submit">
      <AppAlert v-if="form.errors._form" tone="danger">{{ form.errors._form }}</AppAlert>
      <AppInput v-model="form.values.full_name" label="First & last name" placeholder="Enter your full name" autocomplete="name" size="lg" :error="form.errors.full_name" @blur="form.touch('full_name')" />
      <AppInput v-model="form.values.email" label="Email" type="email" placeholder="Enter email address" autocomplete="email" size="lg" :error="form.errors.email" @blur="form.touch('email')" />
      <AppInput v-model="form.values.phone" label="Phone" type="tel" placeholder="(XXX) XXX-XXXX" autocomplete="tel" size="lg" :error="form.errors.phone" @blur="form.touch('phone')" />
      <AppTextarea v-model="form.values.message" label="Message" placeholder="Type your message here" :maxlength="1000" :error="form.errors.message" @blur="form.touch('message')" />
      <AppButton type="submit" size="lg" block :loading="form.submitting">Submit Application</AppButton>
    </form>
  </AppModal>
</template>

<style scoped>
.app-form {
  display: grid;
  gap: 20px;
}

.app-form :deep(.btn) {
  min-height: 52px;
  font-weight: 700;
}

.app-success {
  padding: 48px 0 8px;
}

.app-success__email {
  color: #3a5a17;
  font-weight: 600;
}

.app-success :deep(.success__actions) {
  padding-top: 24px;
  border-top: 1px solid var(--color-border);
}
</style>
