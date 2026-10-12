<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/base/AppButton.vue'
import AppCurrencyInput from '@/components/base/AppCurrencyInput.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppOptionCard from '@/components/base/AppOptionCard.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import AgreementStep from '@/components/checkout/AgreementStep.vue'
import CheckoutShell from '@/components/checkout/CheckoutShell.vue'
import ContactDetailsForm, { type ContactFormValues } from '@/components/checkout/ContactDetailsForm.vue'
import PaymentMethodStep from '@/components/checkout/PaymentMethodStep.vue'
import SummaryCard from '@/components/checkout/SummaryCard.vue'
import { useAsync } from '@/composables/useAsync'
import { useCheckoutDraft } from '@/composables/useCheckoutDraft'
import { useForm } from '@/composables/useForm'
import { useIsMobile } from '@/composables/useMediaQuery'
import { usePayment } from '@/composables/usePayment'
import { capitalService } from '@/services/api'
import { toApiError, type ApiError } from '@/services/http/errors'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { Agreement, CapitalInvestmentOrder, PaymentMethod, PaymentSummaryLine, SignAgreementPayload } from '@/types'
import { addMonths, formatDate, formatNaira, formatSignedNaira } from '@/utils/format'
import { email, phone, required } from '@/utils/validators'

type Step = 'plan' | 'details' | 'agreement' | 'payment'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const isMobile = useIsMobile()
const { pay, processing } = usePayment()
const tenureName = useId()

const { data: plan, loading: planLoading, error: planError, execute: reloadPlan } = useAsync(() => capitalService.plan())
const { draft, clear: clearDraft } = useCheckoutDraft('capital', { amount: null as number | null, tenure: null as number | null })

watch(plan, (p) => {
  if (!p) return
  if (draft.amount === null) draft.amount = p.min_amount
  if (!p.tenures.some((t) => t.months === draft.tenure)) draft.tenure = p.tenures[0]?.months ?? null
})

const step = computed<Step>(() => {
  const s = route.query.step
  return s === 'details' || s === 'agreement' || s === 'payment' ? s : 'plan'
})
const investmentId = computed(() => Number(route.query.investment) || null)
const isInterest = computed(() => plan.value?.checkout_mode === 'interest')
const steps = computed(() => (isInterest.value ? ['Investment Information', 'Personal Information'] : ['Investment plan', 'Sign agreement', 'Payment']))
const stepIndex = computed(() => ({ plan: 0, details: 1, agreement: 1, payment: 2 })[step.value])

function goStep(next: Step, extra: Record<string, string | number> = {}) {
  void router.push({ query: { ...route.query, step: next === 'plan' ? undefined : next, ...extra } })
}

/* ------------------------------ Plan step ------------------------------ */

const tenure = computed(() => plan.value?.tenures.find((t) => t.months === draft.tenure) ?? null)
const amountError = ref<string | null>(null)

function validateAmount(): boolean {
  const p = plan.value
  if (!p) return false
  const amount = draft.amount ?? 0
  if (amount < p.min_amount) amountError.value = `Minimum investment amount is ${formatNaira(p.min_amount)}.`
  else if (amount > p.max_self_serve_amount)
    amountError.value = `For investments above ${formatNaira(p.max_self_serve_amount)}, please contact our investment team.`
  else amountError.value = null
  return !amountError.value && !!tenure.value
}

/** Preview only — Laravel returns the binding quote when the investment is created. */
const preview = computed(() => {
  const amount = draft.amount ?? 0
  const roi = tenure.value?.roi_percent ?? 0
  const projected = Math.round(amount * (1 + roi / 100))
  return { amount, roi, projected, profit: projected - amount, maturity: addMonths(new Date(), tenure.value?.months ?? 0) }
})

const order = ref<CapitalInvestmentOrder | null>(null)

const summarySections = computed<PaymentSummaryLine[][]>(() => {
  const q = order.value?.quote
  const amount = q?.amount ?? preview.value.amount
  const projected = q?.projected_return ?? preview.value.projected
  const sections: PaymentSummaryLine[][] = [
    [{ label: 'Tenure', value: `${q?.tenure_months ?? tenure.value?.months ?? 0} months` }],
    [
      { label: 'Investment amount', value: formatNaira(amount), emphasis: 'strong' },
      { label: 'Interest Rate', value: `${q?.roi_percent ?? preview.value.roi}%` },
      { label: 'Projected return', value: formatNaira(projected) },
      { label: 'Profit', value: formatSignedNaira(projected - amount), emphasis: 'positive' },
    ],
  ]
  if (step.value !== 'plan') {
    sections.push([{ label: 'Maturity date', value: formatDate(q?.maturity_date ?? preview.value.maturity), emphasis: 'strong' }])
  }
  return sections
})

const creating = ref(false)

async function continueFromPlan() {
  if (!validateAmount()) return
  if (isInterest.value) return goStep('details')
  if (!auth.isAuthenticated) {
    ui.info('Log in to continue', 'Create an account or log in to start your investment.')
    return router.push({ name: 'login', query: { redirect: route.fullPath } })
  }
  creating.value = true
  try {
    const created = await capitalService.createInvestment({ amount: draft.amount!, tenure_months: draft.tenure! })
    order.value = created
    goStep('agreement', { investment: created.id })
  } catch (e) {
    const err = toApiError(e)
    if (err.isValidation) amountError.value = err.fieldError('amount') ?? err.message
    else ui.apiError(err)
  } finally {
    creating.value = false
  }
}

/* ------------------------------ Interest ------------------------------ */

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
  if (!validateAmount()) return goStep('plan')
  try {
    const res = await contactForm.submit(() =>
      capitalService.submitInterest({
        amount: draft.amount!,
        tenure_months: draft.tenure!,
        ...contactForm.values,
        alt_phone: contactForm.values.alt_phone || null,
        note: contactForm.values.note || null,
      }),
    )
    if (res) {
      clearDraft()
      void router.replace({ name: 'interest-submitted', query: { product: 'capital_investment', ref: res.reference } })
    }
  } catch (e) {
    ui.apiError(e)
  }
}

/* --------------------------- Agreement & payment --------------------------- */

const agreement = ref<Agreement>()
const loadingOrder = ref(false)
const orderError = ref<ApiError | null>(null)
const signing = ref(false)

async function loadOrder() {
  if (!investmentId.value) return
  loadingOrder.value = true
  orderError.value = null
  try {
    order.value = await capitalService.investment(investmentId.value)
    if (step.value === 'agreement') agreement.value = await capitalService.agreement(investmentId.value)
  } catch (e) {
    orderError.value = toApiError(e)
  } finally {
    loadingOrder.value = false
  }
}

watch(
  [step, investmentId],
  ([s, id]) => {
    if ((s === 'agreement' || s === 'payment') && !id) return goStep('plan')
    if (s === 'agreement' || s === 'payment') void loadOrder()
  },
  { immediate: true },
)

async function sign(payload: SignAgreementPayload) {
  if (!investmentId.value) return
  signing.value = true
  try {
    order.value = await capitalService.signAgreement(investmentId.value, payload)
    goStep('payment', { investment: investmentId.value })
  } catch (e) {
    ui.apiError(e)
  } finally {
    signing.value = false
  }
}

function startPayment(method: PaymentMethod) {
  if (!order.value) return
  clearDraft()
  void pay('capital_investment', order.value.id, method)
}

const headings = computed(() => {
  switch (step.value) {
    case 'details':
      return { title: 'Personal Information', subtitle: 'Please Enter your details' }
    case 'agreement':
      return { title: 'Review and sign your agreement', subtitle: 'Please review your investment contract, then sign to proceed to payment.' }
    case 'payment':
      return { title: 'Complete your payment', subtitle: "Review your investment summary and choose how you'd like to pay." }
    default:
      return { title: 'Enter your investment details', subtitle: 'Choose your investment amount and preferred tenure to see your projected returns.' }
  }
})

function onBack(e: MouseEvent) {
  if (step.value === 'plan') return
  e.preventDefault()
  router.back()
}
</script>

<template>
  <div v-if="planLoading && !plan" class="container container--form state">
    <AppSkeleton height="44px" width="320px" radius="999px" />
    <AppSkeleton height="360px" radius="12px" />
  </div>
  <div v-else-if="planError" class="container container--form state">
    <AppErrorState :error="planError" @retry="reloadPlan" />
  </div>

  <CheckoutShell
    v-else-if="plan"
    :steps="steps"
    :current="stepIndex"
    :title="headings.title"
    :subtitle="headings.subtitle"
    fallback="/capital-investment"
    wide-aside
    @back="onBack"
  >
    <template v-if="step === 'plan'">
      <section class="box" aria-labelledby="amount-label">
        <h2 id="amount-label" class="box__title">Investment amount</h2>
        <AppCurrencyInput
          v-model="draft.amount"
          label="Investment amount"
          hide-label
          size="lg"
          tone="muted"
          :error="amountError"
          :hint="`Minimum investment amount is ${formatNaira(plan.min_amount)}`"
          @blur="validateAmount"
        />
      </section>
      <section class="box" aria-labelledby="tenure-label">
        <h2 id="tenure-label" class="box__title">Choose tenure</h2>
        <div class="box__tenures" role="radiogroup" aria-labelledby="tenure-label">
          <AppOptionCard
            v-for="t in plan.tenures"
            :key="t.months"
            v-model="draft.tenure"
            :name="tenureName"
            :value="t.months"
            :title="`${t.months} months`"
            :subtitle="`${t.roi_percent}% ${isMobile ? 'ROI' : 'return'}`"
            :subtitle-tone="isMobile ? 'success' : 'muted'"
          />
        </div>
      </section>
      <SummaryCard v-if="isMobile" :sections="summarySections" />
    </template>

    <form v-else-if="step === 'details'" id="ci-interest" novalidate @submit.prevent="submitInterest">
      <ContactDetailsForm :form="contactForm" />
      <SummaryCard v-if="isMobile" :sections="summarySections" class="mobile-summary" />
    </form>

    <AgreementStep
      v-else-if="step === 'agreement'"
      :agreement="agreement"
      :loading="loadingOrder"
      :error="orderError"
      :submitting="signing"
      :legal-name="auth.displayName"
      @submit="sign"
      @retry="loadOrder"
    />

    <template v-else-if="step === 'payment'">
      <AppErrorState v-if="orderError" :error="orderError" @retry="loadOrder" />
      <AppSkeleton v-else-if="!order" height="320px" />
      <PaymentMethodStep v-else :amount="order.quote.amount" :processing="processing" @pay="startPayment" />
      <SummaryCard v-if="isMobile && order" :sections="summarySections" class="mobile-summary" />
    </template>

    <template v-if="!isMobile" #aside>
      <SummaryCard :sections="summarySections">
        <AppButton v-if="step === 'plan'" size="lg" block :loading="creating" @click="continueFromPlan">Continue</AppButton>
        <AppButton v-else-if="step === 'details'" type="submit" form="ci-interest" size="lg" block :loading="contactForm.submitting">Continue</AppButton>
      </SummaryCard>
    </template>

    <template v-if="step === 'plan' || step === 'details'" #mobile-actions>
      <AppButton variant="outline" to="/contact">Contact us</AppButton>
      <AppButton v-if="step === 'plan'" :loading="creating" @click="continueFromPlan">Continue</AppButton>
      <AppButton v-else type="submit" form="ci-interest" :loading="contactForm.submitting">Submit</AppButton>
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

.box {
  display: grid;
  gap: 16px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
}

.box + .box {
  margin-top: 24px;
}

.box__title {
  font-size: var(--text-md);
  font-weight: 500;
}

.box__tenures {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.box__tenures :deep(.option) {
  min-height: 84px;
  padding-inline: 20px;
}

.box__tenures :deep(.option__title) {
  font-size: var(--text-base);
}

.mobile-summary {
  margin-top: 24px;
}

@media (max-width: 767px) {
  .box {
    padding: 16px;
  }
  .box + .box {
    margin-top: 24px;
  }
  .box__title {
    font-size: var(--text-sm);
    font-weight: 600;
  }
  .box__tenures {
    gap: 12px;
  }
  .box + :deep(.summary) {
    margin-top: 24px;
  }
}
</style>
