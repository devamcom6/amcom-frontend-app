<script setup lang="ts">
import AppAlert from '@/components/base/AppAlert.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppTextarea from '@/components/base/AppTextarea.vue'
import type { FormApi } from '@/composables/useForm'
import ReferrerFields from './ReferrerFields.vue'

export interface ContactFormValues extends Record<string, unknown> {
  full_name: string
  email: string
  phone: string
  alt_phone: string
  referrer_name: string
  referrer_phone: string
  note: string
}

/** "Personal Information" step for interest submissions (buyback + capital investment). */
defineProps<{ form: FormApi<ContactFormValues> }>()
</script>

<template>
  <div class="contact-form">
    <AppAlert v-if="form.errors._form" tone="danger">{{ form.errors._form }}</AppAlert>
    <AppInput
      v-model="form.values.full_name"
      label="Full Name"
      placeholder="Enter full legal name"
      autocomplete="name"
      size="lg"
      :error="form.errors.full_name"
      required
      @blur="form.touch('full_name')"
    />
    <AppInput
      v-model="form.values.email"
      label="Email address"
      type="email"
      placeholder="Enter email"
      autocomplete="email"
      size="lg"
      :error="form.errors.email"
      required
      @blur="form.touch('email')"
    />
    <div class="contact-form__row">
      <AppInput
        v-model="form.values.phone"
        label="Phone number"
        type="tel"
        placeholder="Enter phone number"
        autocomplete="tel"
        size="lg"
        :error="form.errors.phone"
        required
        @blur="form.touch('phone')"
      />
      <AppInput
        v-model="form.values.alt_phone"
        label="Alt phone number"
        type="tel"
        placeholder="Enter phone number"
        size="lg"
        :error="form.errors.alt_phone"
        @blur="form.touch('alt_phone')"
      />
    </div>
    <ReferrerFields
      v-model:name="form.values.referrer_name"
      v-model:phone="form.values.referrer_phone"
      :name-error="form.errors.referrer_name"
      :phone-error="form.errors.referrer_phone"
      @blur="form.touch"
    />
    <AppTextarea v-model="form.values.note" label="Note" optional placeholder="Enter note" :maxlength="1000" :error="form.errors.note" />
  </div>
</template>

<style scoped>
.contact-form {
  display: grid;
  gap: 22px;
}

.contact-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 767px) {
  .contact-form__row {
    grid-template-columns: 1fr;
    gap: 22px;
  }
}
</style>
