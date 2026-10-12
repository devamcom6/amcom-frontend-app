<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppAlert from '@/components/base/AppAlert.vue'
import AppBackLink from '@/components/base/AppBackLink.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppSelect from '@/components/base/AppSelect.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import OnboardingSteps from '@/components/onboarding/OnboardingSteps.vue'
import { GENDER_OPTIONS } from '@/constants/options'
import { useAsync } from '@/composables/useAsync'
import { useForm } from '@/composables/useForm'
import { profileService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useLookupStore } from '@/stores/lookups'
import { useUiStore } from '@/stores/ui'
import type { Gender, IdType, OnboardingStep, Profile } from '@/types'
import { STORAGE_KEYS, writeString } from '@/utils/storage'
import { email, minLength, phone, required } from '@/utils/validators'

type Step = Exclude<OnboardingStep, 'completed'>
const ORDER: Step[] = ['identity', 'personal', 'contact', 'next_of_kin']
const LABELS = ['Verify your ID', 'Personal information', 'Contact details', 'Next of Kin']

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const lookups = useLookupStore()
void lookups.ensure()

const { data: profile, loading, error, execute } = useAsync(() => profileService.get())

const step = computed<Step>(() => {
  const q = route.query.step as Step | undefined
  if (q && ORDER.includes(q)) return q
  const server = profile.value?.onboarding_step
  return server && server !== 'completed' ? server : 'identity'
})
const index = computed(() => ORDER.indexOf(step.value))

function go(next: Step | 'done') {
  if (next === 'done') return router.replace({ name: 'onboarding-complete' })
  void router.push({ query: { step: next } })
}

function skip() {
  writeString(STORAGE_KEYS.onboardingSkipped, '1', 'session')
  void router.replace('/dashboard')
}

/* -------------------------------- Step 1 -------------------------------- */
const idForm = useForm(
  { id_type: '' as IdType | '', id_number: '' },
  { rules: { id_type: [required('Select an ID type.')], id_number: [required('Enter your ID number.'), minLength(6, 'Enter a valid ID number.')] } },
)

async function verifyId() {
  try {
    const identity = await idForm.submit(() => profileService.verifyIdentity({ id_type: idForm.values.id_type as IdType, id_number: idForm.values.id_number.trim() }))
    if (!identity) return
    await execute()
    auth.patchUser({ kyc_status: identity.status, first_name: identity.first_name, last_name: identity.last_name })
    go('personal')
  } catch (e) {
    ui.apiError(e)
  }
}

/* -------------------------------- Step 2 -------------------------------- */
const personalForm = useForm(
  { first_name: '', last_name: '', date_of_birth: '', gender: '' as Gender | '', nationality: '', state_of_origin: '', lga: '' },
  {
    rules: {
      first_name: [required('Enter your first name.')],
      last_name: [required('Enter your last name.')],
      state_of_origin: [required('Select your state of origin.')],
      lga: [required('Select your LGA.')],
    },
  },
)
const locked = computed(() => new Set(profile.value?.identity?.locked_fields ?? []))
const lgaOptions = computed(() => lookups.lgasFor(personalForm.values.state_of_origin))

async function savePersonal() {
  try {
    const p = await personalForm.submit(() =>
      profileService.savePersonal({
        state_of_origin: personalForm.values.state_of_origin,
        lga: personalForm.values.lga,
        ...(locked.value.has('first_name')
          ? {}
          : {
              first_name: personalForm.values.first_name,
              last_name: personalForm.values.last_name,
              date_of_birth: personalForm.values.date_of_birth || undefined,
              gender: (personalForm.values.gender || undefined) as Gender | undefined,
              nationality: personalForm.values.nationality || undefined,
            }),
      }),
    )
    if (p) {
      profile.value = p
      go('contact')
    }
  } catch (e) {
    ui.apiError(e)
  }
}

/* -------------------------------- Step 3 -------------------------------- */
const contactForm = useForm(
  { country: 'Nigeria', state: '', address: '', phone: '', alt_phone: '' },
  {
    rules: {
      country: [required('Select your country.')],
      state: [required('Select your state.')],
      address: [required('Enter your residential address.')],
      phone: [required('Enter your phone number.'), phone()],
      alt_phone: [phone()],
    },
  },
)

async function saveContact() {
  try {
    const p = await contactForm.submit(() => profileService.saveContact({ ...contactForm.values, alt_phone: contactForm.values.alt_phone || null }))
    if (p) {
      profile.value = p
      auth.patchUser({ phone: contactForm.values.phone })
      go('next_of_kin')
    }
  } catch (e) {
    ui.apiError(e)
  }
}

/* -------------------------------- Step 4 -------------------------------- */
const kinForm = useForm(
  { full_name: '', relationship: '', phone: '', email: '' },
  {
    rules: {
      full_name: [required("Enter your next of kin's full name.")],
      relationship: [required('Select a relationship.')],
      phone: [required('Enter a phone number.'), phone()],
      email: [email()],
    },
  },
)

async function saveKin() {
  try {
    const p = await kinForm.submit(() => profileService.saveNextOfKin({ ...kinForm.values, email: kinForm.values.email || null }))
    if (p) {
      auth.patchUser({ profile_completed: true })
      go('done')
    }
  } catch (e) {
    ui.apiError(e)
  }
}

/* Prefill every step from the saved profile. */
watch(
  profile,
  (p: Profile | undefined) => {
    if (!p) return
    personalForm.reset({
      first_name: p.personal.first_name ?? p.user.first_name ?? '',
      last_name: p.personal.last_name ?? p.user.last_name ?? '',
      date_of_birth: p.personal.date_of_birth ?? '',
      gender: p.personal.gender ?? '',
      nationality: p.personal.nationality ?? '',
      state_of_origin: p.personal.state_of_origin ?? '',
      lga: p.personal.lga ?? '',
    })
    contactForm.reset({
      country: p.contact.country ?? 'Nigeria',
      state: p.contact.state ?? '',
      address: p.contact.address ?? '',
      phone: p.contact.phone ?? '',
      alt_phone: p.contact.alt_phone ?? '',
    })
    if (p.next_of_kin) kinForm.reset({ ...p.next_of_kin, email: p.next_of_kin.email ?? '' })
    if (p.onboarding_step === 'completed' && !route.query.step) void router.replace({ name: 'onboarding-complete' })
  },
  { immediate: true },
)

const dobDisplay = computed(() => {
  const d = personalForm.values.date_of_birth
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
})
const genderLabel = computed(() => GENDER_OPTIONS.find((g) => g.value === personalForm.values.gender)?.label ?? '')
const showSkip = ref(true)
</script>

<template>
  <Teleport to="#auth-header-actions" defer>
    <AppButton v-if="showSkip" variant="outline" size="sm" class="skip" @click="skip">
      <span class="hide-mobile">Skip for now</span><span class="hide-desktop">Skip</span>
    </AppButton>
  </Teleport>

  <div class="setup">
    <OnboardingSteps :steps="LABELS" :current="index" class="setup__steps" />

    <section class="setup__card">
      <AppSkeleton v-if="loading && !profile" :lines="8" height="20px" />
      <AppErrorState v-else-if="error" :error="error" @retry="execute" />

      <!-- 1. Verify ID -->
      <template v-else-if="step === 'identity'">
        <header class="setup__head">
          <h1 class="setup__title">Verify your identity</h1>
          <p class="setup__text">
            We verify your identity to protect transactions and confirm your legal name on documents. Your ID is processed securely and is
            never stored. <RouterLink to="/legal/privacy-policy" class="setup__learn">Learn more</RouterLink>
          </p>
        </header>
        <form class="setup__form" novalidate @submit.prevent="verifyId">
          <AppAlert v-if="idForm.errors._form" tone="danger">{{ idForm.errors._form }}</AppAlert>
          <AppAlert v-if="profile?.identity?.status === 'verified'" tone="success">Your ID is already verified. Re-verifying will update your locked details.</AppAlert>
          <AppSelect v-model="idForm.values.id_type" label="Valid ID" placeholder="Select ID" :options="lookups.idTypes" :error="idForm.errors.id_type" />
          <AppInput v-model="idForm.values.id_number" label="ID Number" placeholder="Enter ID number" autocomplete="off" :error="idForm.errors.id_number" @blur="idForm.touch('id_number')" />
          <AppButton type="submit" size="lg" block :loading="idForm.submitting" loading-label="Verifying your ID">Verify ID</AppButton>
        </form>
        <p class="setup__persona">
          <span class="setup__persona-logo" aria-hidden="true"><b>*</b>persona</span>
          Securely processed by Persona
        </p>
      </template>

      <!-- 2. Personal information -->
      <template v-else-if="step === 'personal'">
        <header class="setup__head">
          <h1 class="setup__title">Personal Information</h1>
          <p class="setup__text">We've pulled your details from your ID verification. Review and fill in anything we couldn't auto-detect.</p>
        </header>
        <form class="setup__form" novalidate @submit.prevent="savePersonal">
          <AppAlert v-if="personalForm.errors._form" tone="danger">{{ personalForm.errors._form }}</AppAlert>
          <div class="setup__row">
            <AppInput v-model="personalForm.values.first_name" label="First name" :locked="locked.has('first_name')" :error="personalForm.errors.first_name" />
            <AppInput v-model="personalForm.values.last_name" label="Last name" :locked="locked.has('last_name')" :error="personalForm.errors.last_name" />
          </div>
          <div class="setup__row">
            <AppInput v-if="locked.has('date_of_birth')" :model-value="dobDisplay" label="Date of Birth" locked />
            <AppInput v-else v-model="personalForm.values.date_of_birth" label="Date of Birth" type="date" />
            <AppInput v-if="locked.has('gender')" :model-value="genderLabel" label="Gender" locked />
            <AppSelect v-else v-model="personalForm.values.gender" label="Gender" :options="GENDER_OPTIONS" />
          </div>
          <AppInput v-model="personalForm.values.nationality" label="Nationality" :locked="locked.has('nationality')" />
          <div class="setup__row">
            <AppSelect v-model="personalForm.values.state_of_origin" label="State of Origin" placeholder="Select state" :options="lookups.states" :error="personalForm.errors.state_of_origin" @update:model-value="personalForm.values.lga = ''" />
            <AppSelect v-if="lgaOptions.length" v-model="personalForm.values.lga" label="Local Govt Area (L.G.A)" placeholder="Select LGA" :options="lgaOptions" :error="personalForm.errors.lga" />
            <AppInput v-else v-model="personalForm.values.lga" label="Local Govt Area (L.G.A)" placeholder="Enter LGA" :error="personalForm.errors.lga" />
          </div>
          <AppButton type="submit" size="lg" block :loading="personalForm.submitting">Save and Continue</AppButton>
        </form>
        <p class="setup__foot">Wrong details or ID? <RouterLink :to="{ query: { step: 'identity' } }" class="link">Re-verify</RouterLink></p>
      </template>

      <!-- 3. Contact details -->
      <template v-else-if="step === 'contact'">
        <AppBackLink icon="chevron" class="setup__back hide-mobile" :fallback="{ query: { step: 'personal' } }" />
        <header class="setup__head">
          <h1 class="setup__title">Contact Details</h1>
          <p class="setup__text">Where are you based? We need your address and phone number for property documentation and legal correspondence.</p>
        </header>
        <form class="setup__form" novalidate @submit.prevent="saveContact">
          <AppAlert v-if="contactForm.errors._form" tone="danger">{{ contactForm.errors._form }}</AppAlert>
          <div class="setup__row">
            <AppSelect v-model="contactForm.values.country" label="Country of residence" placeholder="Select country" :options="lookups.countries" :error="contactForm.errors.country" />
            <AppSelect v-if="contactForm.values.country === 'Nigeria'" v-model="contactForm.values.state" label="State" placeholder="Select state" :options="lookups.states" :error="contactForm.errors.state" />
            <AppInput v-else v-model="contactForm.values.state" label="State / Region" placeholder="Enter state or region" :error="contactForm.errors.state" />
          </div>
          <AppInput v-model="contactForm.values.address" label="Residential address" placeholder="Enter your address" autocomplete="street-address" :error="contactForm.errors.address" @blur="contactForm.touch('address')" />
          <div class="setup__row">
            <AppInput v-model="contactForm.values.phone" label="Phone number" type="tel" placeholder="Enter phone number" autocomplete="tel" :error="contactForm.errors.phone" @blur="contactForm.touch('phone')" />
            <AppInput v-model="contactForm.values.alt_phone" label="Alt phone number" type="tel" placeholder="Enter phone number" :error="contactForm.errors.alt_phone" @blur="contactForm.touch('alt_phone')" />
          </div>
          <AppButton type="submit" size="lg" block :loading="contactForm.submitting">Save and Continue</AppButton>
        </form>
      </template>

      <!-- 4. Next of kin -->
      <template v-else>
        <AppBackLink icon="chevron" class="setup__back hide-mobile" :fallback="{ query: { step: 'contact' } }" />
        <header class="setup__head">
          <h1 class="setup__title">Next of Kin</h1>
          <p class="setup__text">A trusted contact for property ownership records and emergencies. You can update this anytime</p>
        </header>
        <form class="setup__form" novalidate @submit.prevent="saveKin">
          <AppAlert v-if="kinForm.errors._form" tone="danger">{{ kinForm.errors._form }}</AppAlert>
          <AppInput v-model="kinForm.values.full_name" label="Full name" placeholder="Enter full name" :error="kinForm.errors.full_name" @blur="kinForm.touch('full_name')" />
          <div class="setup__row">
            <AppSelect v-model="kinForm.values.relationship" label="Relationship" placeholder="Select relationship" :options="lookups.relationships" :error="kinForm.errors.relationship" />
            <AppInput v-model="kinForm.values.phone" label="Phone" type="tel" placeholder="Enter phone number" :error="kinForm.errors.phone" @blur="kinForm.touch('phone')" />
          </div>
          <AppInput v-model="kinForm.values.email" label="Email" optional type="email" placeholder="Enter email address" :error="kinForm.errors.email" @blur="kinForm.touch('email')" />
          <AppButton type="submit" size="lg" block :loading="kinForm.submitting">Complete profile setup</AppButton>
        </form>
      </template>
    </section>
  </div>
</template>

<style scoped>
.setup {
  display: grid;
  grid-template-columns: 200px minmax(0, 560px);
  justify-content: center;
  gap: 40px;
  max-width: 900px;
  margin: 0 auto;
}

.setup__steps {
  padding-top: 24px;
}

.setup__card {
  padding: 48px;
  border-radius: var(--radius-md);
  background: var(--color-bg);
}

.setup__back {
  margin-bottom: 28px;
}

.setup__head {
  margin-bottom: 28px;
  text-align: center;
}

.setup__title {
  font-size: 1.75rem;
  font-weight: 400;
}

.setup__text {
  margin-top: 12px;
  font-size: var(--text-sm);
  line-height: 1.5;
  color: var(--color-body);
}

.setup__learn {
  color: var(--color-maroon);
  text-decoration: underline;
  font-weight: 500;
}

.setup__form {
  display: grid;
  gap: 20px;
}

.setup__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.setup__persona {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 28px;
  font-size: var(--text-sm);
  color: var(--color-ink);
}

.setup__persona-logo {
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.setup__persona-logo b {
  color: #6366f1;
}

.setup__foot {
  margin-top: 24px;
  text-align: center;
  color: var(--color-body);
}

.skip {
  font-weight: 600;
}

@media (max-width: 899px) {
  .setup {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .setup__steps {
    padding-top: 0;
  }

  .setup__card {
    padding: 0;
    background: transparent;
  }

  .setup__head {
    margin-bottom: 20px;
  }

  .setup__title {
    font-size: 1.6rem;
  }
}

@media (max-width: 480px) {
  .setup__row {
    grid-template-columns: 1fr;
  }

  .setup__row:has(.control.is-locked) {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
