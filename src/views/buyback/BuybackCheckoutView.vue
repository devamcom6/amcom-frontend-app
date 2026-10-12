<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppAlert from '@/components/base/AppAlert.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppModal from '@/components/base/AppModal.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import AgreementStep from '@/components/checkout/AgreementStep.vue'
import CheckoutShell from '@/components/checkout/CheckoutShell.vue'
import ContactDetailsForm, { type ContactFormValues } from '@/components/checkout/ContactDetailsForm.vue'
import PaymentMethodStep from '@/components/checkout/PaymentMethodStep.vue'
import PlotGrid from '@/components/checkout/PlotGrid.vue'
import QuoteBreakdown from '@/components/checkout/QuoteBreakdown.vue'
import SummaryCard from '@/components/checkout/SummaryCard.vue'
import TenureSelector from '@/components/checkout/TenureSelector.vue'
import { useAsync } from '@/composables/useAsync'
import { useCheckoutDraft } from '@/composables/useCheckoutDraft'
import { useForm } from '@/composables/useForm'
import { useIsMobile } from '@/composables/useMediaQuery'
import { usePayment } from '@/composables/usePayment'
import { buybackService } from '@/services/api'
import { toApiError, type ApiError } from '@/services/http/errors'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { Agreement, BuybackOrder, PaymentMethod, PaymentSummaryLine, SignAgreementPayload } from '@/types'
import { addMonths, formatCountWord, formatDate, formatNaira, formatSignedNaira } from '@/utils/format'
import { email, phone, required } from '@/utils/validators'

type Step = 'plot' | 'details' | 'agreement' | 'payment'

const props = defineProps<{ slug: string }>()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const isMobile = useIsMobile()
const { pay, processing } = usePayment()

const { data: estate, error: estateError, loading: estateLoading, execute: reloadEstate } = useAsync(() => buybackService.estate(props.slug))
const { data: plots, loading: plotsLoading, execute: reloadPlots } = useAsync(() => buybackService.plots(props.slug))

const { draft, clear: clearDraft } = useCheckoutDraft(`buyback.${props.slug}`, { plotIds: [] as number[], tenure: null as number | null })

const step = computed<Step>(() => {
  const s = route.query.step
  return s === 'details' || s === 'agreement' || s === 'payment' ? s : 'plot'
})
const orderId = computed(() => Number(route.query.order) || null)
const isInterest = computed(() => estate.value?.checkout_mode === 'interest')

const steps = computed(() => (isInterest.value ? ['Select Plot & Plan', 'Personal Information'] : ['Select plot', 'Review and sign', 'Payment']))
const stepIndex = computed(() => ({ plot: 0, details: 1, agreement: 1, payment: 2 })[step.value])

function goStep(next: Step, extra: Record<string, string | number> = {}) {
  void router.push({ query: { ...route.query, step: next === 'plot' ? undefined : next, ...extra } })
}

/* ------------------------------ Plot & tenure ------------------------------ */

const selectedPlots = computed(() => (plots.value ?? []).filter((p) => draft.plotIds.includes(p.id)))
const tenure = computed(() => estate.value?.tenures.find((t) => t.months === draft.tenure) ?? null)
const sheetOpen = ref(false)
const plotError = ref<string | null>(null)
const tenureError = ref<string | null>(null)

// Default to the first tenure and drop plots that became unavailable since the draft was saved.
watch(estate, (e) => {
  if (e && !e.tenures.some((t) => t.months === draft.tenure)) draft.tenure = e.tenures[0]?.months ?? null
})
watch(plots, (list) => {
  if (!list) return
  const available = new Set(list.filter((p) => p.status === 'available').map((p) => p.id))
  draft.plotIds = draft.plotIds.filter((id) => available.has(id))
})

/** Client-side preview only — Laravel recalculates the authoritative quote on submission. */
const preview = computed(() => {
  const price = selectedPlots.value.reduce((s, p) => s + p.price, 0)
  const roi = tenure.value?.roi_percent ?? 0
  const projected = Math.round(price * (1 + roi / 100))
  return { count: selectedPlots.value.length, price, projected, profit: projected - price }
})

const quoteRows = computed(() => [
  { label: 'No. of plot', value: formatCountWord(preview.value.count) },
  { label: 'Plot price', value: formatNaira(preview.value.price) },
  { label: 'Projected Return', value: formatNaira(preview.value.projected) },
  { label: 'Profit', value: formatSignedNaira(preview.value.profit) },
])

function validatePlotStep(): boolean {
  plotError.value = draft.plotIds.length ? null : 'Select at least one available plot.'
  tenureError.value = draft.tenure ? null : 'Choose a tenure.'
  return !plotError.value && !tenureError.value
}

const creatingOrder = ref(false)

async function continueFromPlot() {
  if (!validatePlotStep() || !estate.value) return
  if (isInterest.value) return goStep('details')

  // Direct purchase requires an account so the agreement and documents can be issued to the investor.
  if (!auth.isAuthenticated) {
    ui.info('Log in to continue', 'Create an account or log in to reserve your plot.')
    return router.push({ name: 'login', query: { redirect: route.fullPath } })
  }
  creatingOrder.value = true
  try {
    const order = await buybackService.createOrder({ estate_id: estate.value.id, plot_ids: draft.plotIds, tenure_months: draft.tenure! })
    goStep('agreement', { order: order.id })
  } catch (e) {
    const err = toApiError(e)
    if (err.code === 'plot_unavailable') void reloadPlots()
    if (err.isValidation) plotError.value = err.fieldError('plot_ids') ?? err.fieldError('tenure_months') ?? err.message
    else ui.apiError(err)
  } finally {
    creatingOrder.value = false
  }
}

/* ---------------------------- Interest details ---------------------------- */

const contactForm = useForm<ContactFormValues>(
  {
    full_name: auth.displayName && auth.displayName !== auth.user?.email ? auth.displayName : '',
    email: auth.user?.email ?? '',
    phone: auth.user?.phone ?? '',
    alt_phone: '',
    note: '',
  },
  {
    rules: {
      full_name: [required('Enter your full legal name.')],
      email: [required('Enter your email address.'), email()],
      phone: [required('Enter a phone number.'), phone()],
      alt_phone: [phone()],
    },
  },
)

async function submitInterest() {
  if (!estate.value || !validatePlotStep()) return goStep('plot')
  try {
    const res = await contactForm.submit(() =>
      buybackService.submitInterest({
        estate_id: estate.value!.id,
        plot_ids: draft.plotIds,
        tenure_months: draft.tenure!,
        ...contactForm.values,
        alt_phone: contactForm.values.alt_phone || null,
        note: contactForm.values.note || null,
      }),
    )
    if (res) {
      clearDraft()
      void router.replace({ name: 'interest-submitted', query: { product: 'buyback', ref: res.reference } })
    }
  } catch (e) {
    ui.apiError(e)
  }
}

/* --------------------------- Agreement & payment --------------------------- */

const order = ref<BuybackOrder | null>(null)
const agreement = ref<Agreement>()
const agreementLoading = ref(false)
const agreementError = ref<ApiError | null>(null)
const signing = ref(false)

async function loadOrder() {
  if (!orderId.value) return
  agreementLoading.value = true
  agreementError.value = null
  try {
    order.value = await buybackService.order(orderId.value)
    if (step.value === 'agreement') agreement.value = await buybackService.agreement(orderId.value)
  } catch (e) {
    agreementError.value = toApiError(e)
  } finally {
    agreementLoading.value = false
  }
}

watch(
  [step, orderId],
  ([s, id]) => {
    if ((s === 'agreement' || s === 'payment') && !id) return goStep('plot')
    if (s === 'agreement' || s === 'payment') void loadOrder()
  },
  { immediate: true },
)

async function sign(payload: SignAgreementPayload) {
  if (!orderId.value) return
  signing.value = true
  try {
    order.value = await buybackService.signAgreement(orderId.value, payload)
    goStep('payment', { order: orderId.value })
  } catch (e) {
    ui.apiError(e)
  } finally {
    signing.value = false
  }
}

function startPayment(method: PaymentMethod) {
  if (!order.value) return
  clearDraft()
  void pay('buyback_order', order.value.id, method)
}

const summarySections = computed<PaymentSummaryLine[][]>(() => {
  const q = order.value?.quote
  const plotsList = order.value?.plots ?? selectedPlots.value
  const price = q?.total_price ?? preview.value.price
  const projected = q?.projected_return ?? preview.value.projected
  const months = q?.tenure_months ?? draft.tenure ?? 0
  return [
    [
      { label: 'Estate', value: order.value?.estate.name ?? estate.value?.name ?? '—' },
      { label: `Plots (${plotsList.length})`, value: plotsList.map((p) => `${p.code} · ${p.size_sqm} sqm`).join('\n') || '—' },
    ],
    [
      { label: 'Price', value: formatNaira(price), emphasis: 'strong' },
      { label: 'Tenure', value: `${months} months` },
      { label: 'Projected return', value: formatNaira(projected) },
      { label: 'Profit', value: formatSignedNaira(projected - price), emphasis: 'positive' },
    ],
    [{ label: 'Maturity date', value: formatDate(q?.maturity_date ?? addMonths(new Date(), months)), emphasis: 'strong' }],
  ]
})

const headings = computed(() => {
  switch (step.value) {
    case 'details':
      return { title: 'Personal Information', subtitle: 'Please Enter your details' }
    case 'agreement':
      return { title: 'Review and sign your agreement', subtitle: 'Confirm your investment details, then read and sign both documents to proceed to payment.' }
    case 'payment':
      return { title: 'Complete your payment', subtitle: "Review your investment summary and choose how you'd like to pay." }
    default:
      return { title: 'Select Plot & Tenure', subtitle: 'Choose your preferred plot and tenure' }
  }
})

function onBack(e: MouseEvent) {
  if (step.value === 'plot') return
  e.preventDefault()
  router.back()
}
</script>

<template>
  <div v-if="estateLoading && !estate" class="container container--form state">
    <AppSkeleton height="44px" width="320px" radius="999px" />
    <AppSkeleton height="420px" radius="12px" />
  </div>
  <div v-else-if="estateError" class="container container--form state">
    <AppErrorState :error="estateError" @retry="reloadEstate" />
  </div>

  <CheckoutShell
    v-else-if="estate"
    :steps="steps"
    :current="stepIndex"
    :title="headings.title"
    :subtitle="headings.subtitle"
    :fallback="{ name: 'estate-detail', params: { slug } }"
    :wide-aside="step === 'agreement' || step === 'payment'"
    @back="onBack"
  >
    <!-- STEP 1: plot & tenure -->
    <template v-if="step === 'plot'">
      <AppAlert v-if="estate.max_plots_per_order > 1" tone="neutral" class="hint">
        You can select up to {{ estate.max_plots_per_order }} plots in {{ estate.name }}.
      </AppAlert>

      <div v-if="!isMobile">
        <AppSkeleton v-if="plotsLoading && !plots" height="320px" />
        <PlotGrid v-else v-model="draft.plotIds" :plots="plots ?? []" :max="estate.max_plots_per_order" @limit="ui.warning(`You can select up to ${estate.max_plots_per_order} plots per order.`)" />
        <p v-if="plotError" class="field-error" role="alert">{{ plotError }}</p>
      </div>

      <div v-else class="mobile-plot">
        <p class="mobile-plot__label">Select Plot</p>
        <button type="button" class="mobile-plot__picker" :class="{ 'is-filled': selectedPlots.length }" @click="sheetOpen = true">
          <template v-if="selectedPlots.length">
            <span class="mobile-plot__codes">{{ selectedPlots.map((p) => p.code).join(', ') }}</span>
            <span class="mobile-plot__meta">{{ selectedPlots.map((p) => `${p.size_sqm} sqm`).join(' • ') }}</span>
          </template>
          <template v-else>
            <span class="mobile-plot__empty">No plot selected</span>
            <span class="mobile-plot__meta">Tap to select a plot</span>
          </template>
        </button>
        <p v-if="plotError" class="field-error" role="alert">{{ plotError }}</p>
        <TenureSelector v-model="draft.tenure" :tenures="estate.tenures" :error="tenureError" class="mobile-plot__tenure" />
        <QuoteBreakdown v-if="selectedPlots.length" :rows="quoteRows" />
        <AppModal v-model:open="sheetOpen" title="Select plot" hide-title>
          <PlotGrid v-model="draft.plotIds" :plots="plots ?? []" :max="estate.max_plots_per_order" @update:model-value="estate.max_plots_per_order === 1 && (sheetOpen = false)" />
          <template v-if="estate.max_plots_per_order > 1" #footer>
            <AppButton block @click="sheetOpen = false">Done ({{ draft.plotIds.length }} selected)</AppButton>
          </template>
        </AppModal>
      </div>
    </template>

    <!-- STEP 2 (interest): personal information -->
    <form v-else-if="step === 'details'" id="interest-form" novalidate @submit.prevent="submitInterest">
      <ContactDetailsForm :form="contactForm" />
    </form>

    <!-- STEP 2 (direct): agreement -->
    <AgreementStep
      v-else-if="step === 'agreement'"
      :agreement="agreement"
      :loading="agreementLoading"
      :error="agreementError"
      :submitting="signing"
      :legal-name="auth.displayName"
      @submit="sign"
      @retry="loadOrder"
    />

    <!-- STEP 3 (direct): payment -->
    <template v-else-if="step === 'payment'">
      <AppErrorState v-if="agreementError" :error="agreementError" @retry="loadOrder" />
      <AppSkeleton v-else-if="!order" height="320px" />
      <PaymentMethodStep v-else :amount="order.quote.total_price" :processing="processing" @pay="startPayment" />
      <SummaryCard v-if="isMobile && order" :sections="summarySections" class="mobile-summary" />
    </template>

    <template #aside>
      <div v-if="(step === 'plot' || step === 'details') && !isMobile" class="tenure-card">
        <TenureSelector v-model="draft.tenure" :tenures="estate.tenures" :error="tenureError" />
        <QuoteBreakdown :rows="quoteRows" class="tenure-card__quote" />
        <div class="tenure-card__actions">
          <AppButton v-if="step === 'plot'" size="lg" block :loading="creatingOrder" @click="continueFromPlot">Continue</AppButton>
          <AppButton v-else type="submit" form="interest-form" size="lg" block :loading="contactForm.submitting">Submit</AppButton>
          <AppButton variant="outline" size="lg" block to="/contact">Contact us</AppButton>
        </div>
      </div>
      <SummaryCard v-else-if="(step === 'agreement' || step === 'payment') && !isMobile" :sections="summarySections" />
      <SummaryCard v-else-if="step === 'details' && isMobile" :sections="summarySections.slice(1)" />
    </template>

    <template v-if="step === 'plot' || step === 'details'" #mobile-actions>
      <AppButton variant="outline" to="/contact">Contact us</AppButton>
      <AppButton v-if="step === 'plot'" :loading="creatingOrder" @click="continueFromPlot">Continue</AppButton>
      <AppButton v-else type="submit" form="interest-form" :loading="contactForm.submitting">Submit</AppButton>
    </template>
  </CheckoutShell>
</template>

<style scoped>
.state {
  display: grid;
  gap: 24px;
  padding-top: 48px;
  padding-bottom: 96px;
}

.hint {
  margin-bottom: 20px;
}

.field-error {
  margin-top: 12px;
  font-size: var(--text-sm);
  color: var(--color-danger);
}

.tenure-card {
  display: grid;
  gap: 24px;
  padding: 40px 24px 32px;
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  box-shadow: 0 0 0 1px rgba(16, 24, 40, 0.04), 0 8px 28px rgba(16, 24, 40, 0.08);
}

.tenure-card__actions {
  display: grid;
  gap: 10px;
  margin-top: 24px;
}

.tenure-card__actions :deep(.btn) {
  min-height: 50px;
  border-radius: var(--radius-xs);
}

.mobile-plot {
  display: grid;
  gap: 12px;
}

.mobile-plot__label {
  font-size: var(--text-sm);
}

.mobile-plot__picker {
  display: grid;
  gap: 2px;
  padding: 18px 16px;
  border: 1px dashed #d1d5db;
  border-radius: var(--radius-md);
  background: #f9fafb;
  text-align: left;
}

.mobile-plot__picker.is-filled {
  border: 2px solid var(--color-success-strong);
  background: var(--color-success-bg);
}

.mobile-plot__empty {
  font-weight: 700;
  color: var(--color-muted);
}

.mobile-plot__codes {
  font-weight: 700;
  color: var(--color-success-strong);
}

.mobile-plot__meta {
  font-size: var(--text-xs);
  color: var(--color-subtle);
}

.is-filled .mobile-plot__meta {
  color: var(--color-ink);
}

.mobile-plot__tenure {
  margin-top: 12px;
  margin-bottom: 12px;
}

.mobile-summary {
  margin-top: 24px;
}
</style>
