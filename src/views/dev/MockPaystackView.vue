<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/base/AppButton.vue'
import AppLogo from '@/components/base/AppLogo.vue'
import { http } from '@/services/http/client'
import { formatNaira } from '@/utils/format'

/**
 * DEVELOPMENT ONLY (registered when VITE_USE_MOCK_API=true).
 * Stands in for Paystack's hosted checkout so every payment outcome can be exercised
 * without a backend. In production `authorization_url` points to checkout.paystack.com.
 */
const route = useRoute()
const reference = computed(() => String(route.query.reference ?? ''))
const amount = computed(() => Number(route.query.amount ?? 0))
const callback = computed(() => String(route.query.callback_url ?? '/payments/callback'))
const busy = ref<string | null>(null)

async function complete(outcome: 'success' | 'failed' | 'abandoned') {
  busy.value = outcome
  try {
    // Simulates Paystack → Laravel webhook. Never something a real frontend does.
    await http.post(`/__mock/payments/${reference.value}/complete`, { outcome })
  } finally {
    const url = new URL(callback.value, window.location.origin)
    url.searchParams.set('reference', reference.value)
    url.searchParams.set('trxref', reference.value)
    window.location.assign(url.pathname + url.search)
  }
}
</script>

<template>
  <main id="main" class="paystack">
    <div class="paystack__card">
      <div class="paystack__head">
        <AppLogo :size="40" :link="false" />
        <div>
          <p class="paystack__merchant">Amcom</p>
          <p class="paystack__amount">Pay <strong>{{ formatNaira(amount) }}</strong></p>
        </div>
      </div>
      <p class="paystack__badge">Simulated Paystack checkout · mock API mode</p>
      <p class="paystack__ref">Reference: {{ reference }}</p>
      <div class="paystack__actions">
        <AppButton block size="lg" :loading="busy === 'success'" :disabled="!!busy" @click="complete('success')">Simulate successful payment</AppButton>
        <AppButton block size="lg" variant="danger-soft" :loading="busy === 'failed'" :disabled="!!busy" @click="complete('failed')">Simulate declined card</AppButton>
        <AppButton block size="lg" variant="secondary" :loading="busy === 'abandoned'" :disabled="!!busy" @click="complete('abandoned')">Cancel payment</AppButton>
      </div>
      <p class="paystack__note">Secured by Paystack (simulation)</p>
    </div>
  </main>
</template>

<style scoped>
.paystack {
  flex: 1;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #0b2534;
}

.paystack__card {
  width: 100%;
  max-width: 420px;
  padding: 28px;
  border-radius: var(--radius-lg);
  background: #fff;
  box-shadow: var(--shadow-lg);
}

.paystack__head {
  display: flex;
  align-items: center;
  gap: 14px;
}

.paystack__merchant {
  font-weight: 600;
}

.paystack__amount {
  color: var(--color-muted);
}

.paystack__amount strong {
  color: #0ba4db;
}

.paystack__badge {
  margin-top: 20px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  background: #fff7e6;
  color: #92400e;
  font-size: var(--text-xs);
}

.paystack__ref {
  margin-top: 12px;
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.paystack__actions {
  display: grid;
  gap: 10px;
  margin-top: 20px;
}

.paystack__note {
  margin-top: 16px;
  font-size: var(--text-xs);
  text-align: center;
  color: var(--color-muted);
}
</style>
