<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppAlert from '@/components/base/AppAlert.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppCheckbox from '@/components/base/AppCheckbox.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppModal from '@/components/base/AppModal.vue'
import AppSuccessPanel from '@/components/base/AppSuccessPanel.vue'
import AppTextarea from '@/components/base/AppTextarea.vue'
import ReferrerFields from '@/components/checkout/ReferrerFields.vue'
import { useForm } from '@/composables/useForm'
import { propertyService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useLookupStore } from '@/stores/lookups'
import { useUiStore } from '@/stores/ui'
import type { PropertyDetail } from '@/types'
import { email, phone, required } from '@/utils/validators'

/** "Start application" — public form; Laravel emails a confirmation (ZeptoMail) on success. */
const props = defineProps<{ property: PropertyDetail }>()
const open = defineModel<boolean>('open', { default: false })
const auth = useAuthStore()
const ui = useUiStore()
const lookups = useLookupStore()
const done = ref(false)

/** Versioned terms document from GET /lookups (legal.buyer_terms_url); a .docx downloads rather than opens. */
const termsUrl = computed(() => lookups.buyerTermsUrl)
const termsIsWordDoc = computed(() => /\.docx?(\?|#|$)/i.test(termsUrl.value ?? ''))

const form = useForm(
  {
    full_name: auth.displayName || '',
    email: auth.user?.email ?? '',
    phone: auth.user?.phone ?? '',
    referrer_name: '',
    referrer_phone: '',
    message: '',
    accept_terms: false,
  },
  {
    rules: {
      full_name: [required('Enter your first and last name.')],
      email: [required('Enter your email address.'), email()],
      phone: [required('Enter your phone number.'), phone()],
      referrer_phone: [phone()],
      message: [required('Tell us a little about your interest.')],
      accept_terms: [(v) => v === true || 'Please confirm you have read and understood the Terms and Conditions.'],
    },
  },
)

watch(
  open,
  (v) => {
    if (!v) return
    done.value = false
    void lookups.ensure() // cached after the first load; retried here if it failed earlier
  },
  { immediate: true },
)

async function submit() {
  try {
    const res = await form.submit(() => propertyService.apply(props.property.slug, {
        ...form.values,
        referrer_name: form.values.referrer_name.trim() || null,
        referrer_phone: form.values.referrer_phone || null,
      }),
    )
    if (res) {
      done.value = true
      form.reset({ full_name: form.values.full_name, email: form.values.email, phone: form.values.phone, accept_terms: false })
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
      <div class="app-form__row">
        <AppInput v-model="form.values.email" label="Email" type="email" placeholder="Enter email address" autocomplete="email" size="lg" :error="form.errors.email" @blur="form.touch('email')" />
        <AppInput v-model="form.values.phone" label="Phone" type="tel" placeholder="(XXX) XXX-XXXX" autocomplete="tel" size="lg" :error="form.errors.phone" @blur="form.touch('phone')" />
      </div>
      <ReferrerFields
        v-model:name="form.values.referrer_name"
        v-model:phone="form.values.referrer_phone"
        :name-error="form.errors.referrer_name"
        :phone-error="form.errors.referrer_phone"
        @blur="form.touch"
      />
      <AppTextarea v-model="form.values.message" label="Message" placeholder="Type your message here" :maxlength="1000" :error="form.errors.message" @blur="form.touch('message')" />
      <AppCheckbox v-model="form.values.accept_terms" :error="form.errors.accept_terms" class="app-terms" @update:model-value="form.touch('accept_terms')">
        I have read and understood the
        <a v-if="termsUrl" :href="termsUrl" target="_blank" rel="noopener noreferrer" class="app-terms__link" @click.stop>Terms and Conditions</a>
        <template v-else>Terms and Conditions</template>
        <span v-if="termsUrl && termsIsWordDoc" class="app-terms__hint"> (Word document)</span>
      </AppCheckbox>
    </form>

    <template v-if="!done" #footer>
      <AppButton type="submit" form="application-form" size="lg" block :loading="form.submitting" class="app-submit">Submit Application</AppButton>
    </template>
  </AppModal>
</template>

<style scoped>
.app-form {
  display: grid;
  gap: 20px;
}

.app-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.app-terms__link {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: underline;
}

.app-terms__hint {
  color: var(--color-muted);
}

.app-submit {
  min-height: 52px;
  font-weight: 700;
}

@media (max-width: 767px) {
  .app-form__row {
    grid-template-columns: 1fr;
    gap: 20px;
  }
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
