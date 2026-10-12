<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppAlert from '@/components/base/AppAlert.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppSpinner from '@/components/base/AppSpinner.vue'
import AppSuccessPanel from '@/components/base/AppSuccessPanel.vue'
import SummaryCard from '@/components/checkout/SummaryCard.vue'
import { COMPANY } from '@/constants/site'
import { paymentService } from '@/services/api'
import { toApiError, type ApiError } from '@/services/http/errors'
import type { PaymentVerification } from '@/types'
import { PAYMENT_RETURN_KEY } from '@/composables/usePayment'
import { readString } from '@/utils/storage'

/**
 * Paystack redirects here with ?reference=…&trxref=…
 * The page NEVER assumes success from the redirect — it asks Laravel, which verifies the
 * transaction with Paystack server-side (and via webhook), and polls while it's pending.
 */
const route = useRoute()
const reference = computed(() => String(route.query.reference ?? route.query.trxref ?? ''))
const result = ref<PaymentVerification | null>(null)
const error = ref<ApiError | null>(null)
const attempts = ref(0)
const MAX_ATTEMPTS = 8
let timer: ReturnType<typeof setTimeout> | undefined

async function verify() {
  if (!reference.value) {
    error.value = toApiError(new Error('missing'))
    return
  }
  try {
    result.value = await paymentService.verify(reference.value)
    error.value = null
    if ((result.value.status === 'pending' || result.value.status === 'processing') && attempts.value < MAX_ATTEMPTS) {
      attempts.value++
      timer = setTimeout(verify, Math.min(2000 * attempts.value, 8000))
    }
  } catch (e) {
    error.value = toApiError(e)
  }
}
void verify()
onBeforeUnmount(() => clearTimeout(timer))

const status = computed(() => result.value?.status)
const isListing = computed(() => result.value?.payable_type === 'listing_fee')
const docLabel = computed(() =>
  result.value?.payable_type === 'buyback_order' ? 'signed Buy-Back Agreement' : 'signed Investment Contract',
)

const retryUrl = readString(PAYMENT_RETURN_KEY, 'session') ?? '/dashboard'

function retryCheck() {
  attempts.value = 0
  void verify()
}
</script>

<template>
  <section class="result">
    <!-- Verifying -->
    <div v-if="!result && !error" class="result__state" role="status">
      <AppSpinner :size="36" />
      <h1 class="result__state-title">Confirming your payment…</h1>
      <p>Please don't close this page. We're verifying the transaction with Paystack.</p>
    </div>

    <!-- Lookup error -->
    <div v-else-if="error && !result" class="result__state">
      <h1 class="result__state-title">We couldn't confirm this payment</h1>
      <p>{{ reference ? error.message : 'The payment reference is missing from the link.' }}</p>
      <div class="result__actions">
        <AppButton v-if="reference" @click="retryCheck">Check again</AppButton>
        <AppButton variant="outline" to="/dashboard/transactions">View payment history</AppButton>
      </div>
    </div>

    <template v-else-if="result">
      <!-- Success: listing fee -->
      <div v-if="status === 'success' && isListing" class="result__narrow">
        <AppSuccessPanel title="Listing Created" size="lg">
          <p>Our team will inspect and verify your property within 3-5 business days. You'll receive an update via email at your registered address.</p>
          <template #actions>
            <AppButton :to="result.next_url ?? '/dashboard/property-management'">Go to dashboard</AppButton>
          </template>
          <template #note><p class="center">You can track your listing status anytime from your dashboard.</p></template>
        </AppSuccessPanel>
      </div>

      <!-- Success: investment / purchase -->
      <div v-else-if="status === 'success'" class="result__grid">
        <AppSuccessPanel title="Payment successful" align="start" tone="maroon" class="result__panel">
          <p v-if="result.payable_type === 'holding_payment'">Your payment has been received. A receipt is available in your dashboard.</p>
          <p v-else>Your Payment Receipt and {{ docLabel }} are ready in your Dashboard.</p>
          <template #actions>
            <AppButton :to="result.next_url ?? '/dashboard'">
              {{ result.payable_type === 'capital_investment' ? 'Go to my investment vault' : 'Go to dashboard' }}
            </AppButton>
          </template>
          <template #note>Your documents are also available anytime from your dashboard — no need to search your email.</template>
        </AppSuccessPanel>
        <SummaryCard :sections="result.summary.sections" class="result__summary" />
      </div>

      <!-- Pending -->
      <div v-else-if="status === 'pending' || status === 'processing'" class="result__state" role="status">
        <AppSpinner v-if="attempts < MAX_ATTEMPTS" :size="36" />
        <h1 class="result__state-title">Your payment is being processed</h1>
        <p>Bank transfers can take a few minutes to confirm. We'll email you and update your dashboard as soon as it clears.</p>
        <div class="result__actions">
          <AppButton variant="outline" :disabled="attempts < MAX_ATTEMPTS" @click="retryCheck">Check again</AppButton>
          <AppButton to="/dashboard">Go to dashboard</AppButton>
        </div>
      </div>

      <!-- Failed / abandoned -->
      <div v-else class="result__state">
        <h1 class="result__state-title">{{ status === 'abandoned' ? 'Payment was not completed' : 'Payment failed' }}</h1>
        <AppAlert tone="danger" class="result__alert">
          {{ result.gateway_response ?? 'Your bank declined the transaction.' }} No money has been taken from your account.
        </AppAlert>
        <p>Your reservation is held for a short time. You can try again or choose another payment method.</p>
        <div class="result__actions">
          <AppButton :to="retryUrl">Try again</AppButton>
          <AppButton variant="outline" to="/contact">Contact support</AppButton>
        </div>
      </div>

      <p class="result__ref">Reference: {{ result.reference }}</p>
    </template>

    <p class="result__help">
      Need help? Email <a :href="`mailto:${COMPANY.supportEmail}`">{{ COMPANY.supportEmail }}</a> or call {{ COMPANY.supportPhone }}
    </p>
  </section>
</template>

<style scoped>
.result {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 96px var(--gutter);
}

.result__grid {
  display: grid;
  grid-template-columns: minmax(0, 600px) minmax(0, 458px);
  gap: 48px;
  align-items: start;
  width: 100%;
  max-width: 1106px;
}

.result__panel :deep(.success__illus) {
  margin-bottom: 64px;
}

.result__panel :deep(.success__body) {
  font-size: var(--text-md);
}

.result__narrow {
  width: 100%;
  max-width: 600px;
}

.result__narrow :deep(.success__illus) {
  margin-bottom: 64px;
}

.center {
  text-align: center;
}

.result__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-width: 560px;
  text-align: center;
  color: var(--color-body);
}

.result__state-title {
  margin-top: 8px;
  font-size: var(--text-2xl);
  font-weight: 500;
  color: var(--color-ink);
}

.result__alert {
  width: 100%;
  text-align: left;
}

.result__actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.result__ref {
  margin-top: 32px;
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.result__help {
  margin-top: 24px;
  font-size: var(--text-sm);
  color: var(--color-body);
  text-align: center;
}

@media (max-width: 899px) {
  .result {
    padding-top: 48px;
  }

  .result__grid {
    grid-template-columns: 1fr;
  }

  .result__panel :deep(.success__illus) {
    margin-bottom: 32px;
  }
}
</style>
