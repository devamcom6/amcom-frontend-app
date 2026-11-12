<script setup lang="ts">
import AppInput from '@/components/base/AppInput.vue'

/**
 * Optional "Referrer's Name / Referrer's Phone" pair, side by side on desktop.
 * Used on every interest, application and direct-purchase form. The API links the
 * submission to an existing account when the phone matches one.
 */
withDefaults(
  defineProps<{
    nameError?: string | null
    phoneError?: string | null
    size?: 'md' | 'lg'
  }>(),
  { size: 'lg' },
)
const name = defineModel<string>('name', { default: '' })
const phone = defineModel<string>('phone', { default: '' })
const emit = defineEmits<{ blur: ['referrer_name' | 'referrer_phone'] }>()
</script>

<template>
  <div class="referrer">
    <AppInput
      v-model="name"
      label="Referrer's Name"
      optional
      placeholder="Enter Name"
      autocomplete="off"
      :size="size"
      :maxlength="120"
      :error="nameError"
      @blur="emit('blur', 'referrer_name')"
    />
    <AppInput
      v-model="phone"
      label="Referrer's Phone"
      optional
      type="tel"
      placeholder="Enter phone number"
      autocomplete="off"
      :size="size"
      :error="phoneError"
      @blur="emit('blur', 'referrer_phone')"
    />
  </div>
</template>

<style scoped>
.referrer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 767px) {
  .referrer {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
</style>
