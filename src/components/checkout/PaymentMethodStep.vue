<script setup lang="ts">
import { ref } from 'vue'
import AppButton from '@/components/base/AppButton.vue'
import AppOptionCard from '@/components/base/AppOptionCard.vue'
import type { PaymentMethod } from '@/types'
import { formatNaira } from '@/utils/format'

/** "Choose payment method" card. The actual charge happens on Paystack's hosted checkout. */
defineProps<{ amount: number; processing: boolean }>()
const emit = defineEmits<{ pay: [PaymentMethod] }>()
const method = ref<PaymentMethod>('bank_transfer')
</script>

<template>
  <section class="pay" aria-labelledby="pay-title">
    <h2 id="pay-title" class="pay__title">Choose payment method</h2>
    <div class="pay__options" role="radiogroup" aria-labelledby="pay-title">
      <AppOptionCard v-model="method" name="payment-method" value="bank_transfer" title="Bank transfer" subtitle="Instant confirmation" subtitle-tone="muted" indicator="radio" />
      <AppOptionCard v-model="method" name="payment-method" value="card" title="Debit card" subtitle="Visa, Mastercard, Verve" subtitle-tone="muted" indicator="radio" />
    </div>
    <p class="pay__terms">
      By clicking "Pay now," you confirm you have read and agree to Amcom's
      <RouterLink to="/legal/terms-of-service" class="pay__link">Terms of Service</RouterLink> and
      <RouterLink to="/legal/privacy-policy" class="pay__link">Privacy Policy</RouterLink>.
    </p>
    <AppButton size="lg" block :loading="processing" loading-label="Redirecting to Paystack" @click="emit('pay', method)">
      Pay {{ formatNaira(amount) }}
    </AppButton>
    <p class="pay__secure">Secured by Paystack · PCI-DSS certified gateway</p>
  </section>
</template>

<style scoped>
.pay {
  display: grid;
  gap: 16px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
}

.pay__title {
  font-size: var(--text-md);
  font-weight: 500;
}

.pay__options {
  display: grid;
  gap: 16px;
}

.pay__options :deep(.option) {
  min-height: 80px;
}

.pay__terms {
  font-size: var(--text-xs);
  color: var(--color-body);
}

.pay__link {
  text-decoration: underline;
}

.pay__secure {
  font-size: var(--text-xs);
  text-align: center;
  color: var(--color-body);
}

@media (max-width: 767px) {
  .pay {
    padding: 16px;
  }
}
</style>
