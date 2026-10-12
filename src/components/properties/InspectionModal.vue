<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppAlert from '@/components/base/AppAlert.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppChoiceChips from '@/components/base/AppChoiceChips.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppModal from '@/components/base/AppModal.vue'
import AppPhoneInput from '@/components/base/AppPhoneInput.vue'
import AppSelect from '@/components/base/AppSelect.vue'
import AppSuccessPanel from '@/components/base/AppSuccessPanel.vue'
import AppTextarea from '@/components/base/AppTextarea.vue'
import { useAsync } from '@/composables/useAsync'
import { useForm } from '@/composables/useForm'
import { propertyService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { Inspection, InspectionAttendee, InspectionType, PropertyDetail } from '@/types'
import { formatDate } from '@/utils/format'
import { email, phone, required } from '@/utils/validators'

const props = defineProps<{ property: PropertyDetail }>()
const open = defineModel<boolean>('open', { default: false })
const auth = useAuthStore()
const ui = useUiStore()
const booked = ref<Inspection | null>(null)

const availability = useAsync(() => propertyService.inspectionAvailability(props.property.slug), { immediate: false })

const self = () => ({ full_name: auth.displayName || '', email: auth.user?.email ?? '', phone: auth.user?.phone ?? '' })

const form = useForm(
  {
    type: 'in_person' as InspectionType,
    attendee: 'self' as InspectionAttendee,
    ...self(),
    date: '',
    time: '',
    message: '',
  },
  {
    rules: {
      full_name: [required('Enter the attendee’s name.')],
      email: [required('Enter an email address.'), email()],
      phone: [required('Enter a phone number.'), phone()],
      date: [required('Select a date.')],
      time: [required('Select a time.')],
    },
  },
)

watch(open, (v) => {
  if (v) {
    booked.value = null
    if (!availability.data.value) void availability.execute()
  }
})

watch(
  () => form.values.attendee,
  (who) => {
    if (who === 'someone_else') Object.assign(form.values, { full_name: '', email: '', phone: '' })
    else Object.assign(form.values, self())
  },
)

const dateOptions = computed(() => (availability.data.value ?? []).map((d) => ({ value: d.date, label: formatDate(d.date) })))
const timeOptions = computed(() =>
  (availability.data.value?.find((d) => d.date === form.values.date)?.times ?? []).map((t) => ({ value: t, label: t })),
)
watch(
  () => form.values.date,
  () => (form.values.time = ''),
)

async function submit() {
  try {
    const res = await form.submit(() => propertyService.bookInspection(props.property.slug, { ...form.values, message: form.values.message || null }))
    if (res) booked.value = res
  } catch (e) {
    ui.apiError(e)
  }
}

/** Builds an .ics client-side when the API doesn't provide a calendar URL. */
function addToCalendar() {
  const b = booked.value
  if (!b) return
  if (b.calendar_url) return window.open(b.calendar_url, '_blank', 'noopener')
  const start = new Date(b.scheduled_for)
  const end = new Date(start.getTime() + 60 * 60_000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Amcom//Inspection//EN',
    'BEGIN:VEVENT',
    `UID:${b.reference}@amcom`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:Property inspection — ${b.property_title}`,
    `LOCATION:${props.property.address}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `inspection-${b.reference}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
</script>

<template>
  <AppModal
    v-model:open="open"
    :title="booked ? undefined : 'Book inspection'"
    size="md"
    :persistent="form.submitting"
  >
    <AppSuccessPanel v-if="booked" title="Inspection Booked!" heading-level="h2" class="ins-success">
      <p>Your inspection for this property has been successfully scheduled. You will receive a confirmation with all the details shortly.</p>
      <p class="ins-success__email">A confirmation email has been sent to your inbox.</p>
      <template #actions>
        <AppButton size="lg" block to="/properties" @click="open = false">Back to Listings</AppButton>
        <AppButton size="lg" block variant="secondary" @click="addToCalendar">Add to Calendar</AppButton>
      </template>
    </AppSuccessPanel>

    <form v-else id="inspection-form" class="ins-form" novalidate @submit.prevent="submit">
      <p class="ins-form__intro hide-desktop">Tell us when you'd like to visit this property.</p>
      <AppAlert v-if="form.errors._form" tone="danger">{{ form.errors._form }}</AppAlert>
      <AppChoiceChips
        v-model="form.values.type"
        label="Inspection Type"
        class="ins-form__chips"
        :options="[
          { value: 'in_person', label: 'In-person' },
          { value: 'virtual', label: 'Virtual' },
        ]"
      />
      <AppChoiceChips
        v-model="form.values.attendee"
        label="Who will attend?"
        class="ins-form__chips"
        :options="[
          { value: 'self', label: 'Myself' },
          { value: 'someone_else', label: 'Someone else' },
        ]"
      />
      <AppInput v-model="form.values.full_name" label="Full Name" placeholder="Enter your name" autocomplete="name" :error="form.errors.full_name" @blur="form.touch('full_name')" />
      <AppInput v-model="form.values.email" label="Email Address" type="email" placeholder="olivia@example.com" autocomplete="email" :error="form.errors.email" @blur="form.touch('email')" />
      <AppPhoneInput v-model="form.values.phone" label="Phone Number (Preferably Whatsapp)" :error="form.errors.phone" @blur="form.touch('phone')" />
      <div class="ins-form__row">
        <AppSelect v-model="form.values.date" label="Date" placeholder="Select date" :options="dateOptions" :loading="availability.loading.value" :error="form.errors.date" />
        <AppSelect v-model="form.values.time" label="Time" placeholder="Select time" :options="timeOptions" :disabled="!form.values.date" :error="form.errors.time" />
      </div>
      <AppTextarea v-model="form.values.message" label="Message" placeholder="Write your comment here..." :maxlength="1000" />
    </form>

    <template v-if="!booked" #footer>
      <AppButton type="submit" form="inspection-form" size="lg" block :loading="form.submitting" class="ins-form__submit">Book inspection</AppButton>
      <p class="ins-form__terms hide-desktop">By continuing you agree to the Property Terms, Platform Terms of Use, and Privacy Policy.</p>
    </template>
  </AppModal>
</template>

<style scoped>
.ins-form {
  display: grid;
  gap: 18px;
}

.ins-form__intro {
  margin-top: -8px;
  font-size: var(--text-sm);
  color: var(--color-body);
}

.ins-form__chips :deep(.chips-field__legend) {
  margin-bottom: 4px;
}

.ins-form__chips :deep(.chip) {
  color: var(--color-ink);
  border-color: #d1d5db;
}

.ins-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.ins-form__submit {
  font-weight: 700;
}

.ins-form__terms {
  margin-top: 10px;
  font-size: 11px;
  text-align: center;
  color: var(--color-muted);
}

.ins-success {
  padding: 40px 0 8px;
}

.ins-success__email {
  color: #3a5a17;
  font-weight: 600;
}

.ins-success :deep(.success__actions) {
  padding-top: 24px;
  border-top: 1px solid var(--color-border);
  gap: 10px;
}

@media (max-width: 767px) {
  .ins-form__row {
    grid-template-columns: 1fr;
  }
  .ins-form__chips :deep(.chips) {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
</style>
