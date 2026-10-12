<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppAlert from '@/components/base/AppAlert.vue'
import AppBackLink from '@/components/base/AppBackLink.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppCheckbox from '@/components/base/AppCheckbox.vue'
import AppChoiceChips from '@/components/base/AppChoiceChips.vue'
import AppCurrencyInput from '@/components/base/AppCurrencyInput.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppModal from '@/components/base/AppModal.vue'
import AppSelect from '@/components/base/AppSelect.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import AppStepper from '@/components/base/AppStepper.vue'
import AppTextarea from '@/components/base/AppTextarea.vue'
import PhotoUploader from '@/components/properties/PhotoUploader.vue'
import { AMENITY_OPTIONS, CONDITION_OPTIONS, FURNISHING_OPTIONS, LISTING_TYPE_OPTIONS, PROPERTY_TYPE_OPTIONS } from '@/constants/options'
import { useAsync } from '@/composables/useAsync'
import { useForm } from '@/composables/useForm'
import { usePayment } from '@/composables/usePayment'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { listingService } from '@/services/api'
import { toApiError, type ApiError } from '@/services/http/errors'
import { useLookupStore } from '@/stores/lookups'
import { useUiStore } from '@/stores/ui'
import type { FurnishingStatus, Listing, ListingType, Media, PropertyCondition, PropertyType } from '@/types'
import { formatNaira } from '@/utils/format'
import { minValue, required } from '@/utils/validators'

const props = defineProps<{ listingId?: number }>()
const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const lookups = useLookupStore()
void lookups.ensure()
const { pay, processing } = usePayment()

type Step = 'details' | 'photos'
const step = computed<Step>(() => (route.query.step === 'photos' ? 'photos' : 'details'))
const id = computed(() => props.listingId ?? (Number(route.query.listing) || null))
const isEdit = computed(() => !!props.listingId)

const listing = ref<Listing | null>(null)
const loadError = ref<ApiError | null>(null)
const loadingListing = ref(false)
const { data: fee } = useAsync(() => listingService.fee())

const form = useForm(
  {
    listing_type: 'sale' as ListingType,
    property_type: 'apartment' as PropertyType,
    state: '',
    city: '',
    address: '',
    size_sqm: '' as string | number,
    bedrooms: '' as string | number,
    bathrooms: '' as string | number,
    asking_price: null as number | null,
    condition: 'newly_built' as PropertyCondition,
    furnishing: 'furnished' as FurnishingStatus,
    amenities: ['parking', 'security'] as string[],
    description: '',
  },
  {
    rules: {
      state: [required('Select a state.')],
      city: [required('Enter the city or area.')],
      address: [required('Enter the property address.')],
      size_sqm: [minValue(1, 'Enter a valid size.')],
      asking_price: [required('Enter an asking price.'), minValue(1, 'Enter a valid amount.')],
    },
  },
)
useUnsavedChanges(computed(() => step.value === 'details' && form.isDirty), computed(() => form.submitting))

async function loadListing() {
  if (!id.value) return
  loadingListing.value = true
  loadError.value = null
  try {
    listing.value = await listingService.get(id.value)
    const l = listing.value
    form.reset({
      listing_type: l.listing_type,
      property_type: l.property_type,
      state: l.state,
      city: l.city,
      address: l.address,
      size_sqm: l.size_sqm ?? '',
      bedrooms: l.bedrooms ?? '',
      bathrooms: l.bathrooms ?? '',
      asking_price: l.asking_price,
      condition: l.condition,
      furnishing: l.furnishing,
      amenities: l.amenities,
      description: l.description ?? '',
    })
  } catch (e) {
    loadError.value = toApiError(e)
  } finally {
    loadingListing.value = false
  }
}
watch(id, () => void loadListing(), { immediate: true })

const cityOptions = computed(() => {
  const lgas = lookups.lgasFor(form.values.state)
  return lgas
})

function payload() {
  const n = (v: string | number) => (v === '' || v === null ? null : Number(v))
  return {
    ...form.values,
    size_sqm: n(form.values.size_sqm),
    bedrooms: n(form.values.bedrooms),
    bathrooms: n(form.values.bathrooms),
    asking_price: form.values.asking_price ?? 0,
    description: form.values.description || null,
  }
}

async function saveDetails() {
  try {
    const saved = await form.submit(() =>
      id.value ? listingService.update(id.value, payload()) : listingService.create(payload()),
    )
    if (!saved) return
    listing.value = saved
    form.markClean()
    const needsPayment = saved.status === 'draft' || saved.status === 'awaiting_payment'
    if (isEdit.value && !needsPayment) {
      ui.success('Listing updated', 'Our team will review the changes.')
      return router.push({ name: 'dashboard-listing', params: { id: saved.id } })
    }
    if (isEdit.value) return router.push({ name: 'list-property', query: { step: 'photos', listing: saved.id } })
    void router.push({ query: { step: 'photos', listing: saved.id } })
  } catch (e) {
    ui.apiError(e)
  }
}

/* Photos */
const photoError = ref<string | null>(null)

function uploadPhoto(file: File, onProgress: (p: number) => void): Promise<Media> {
  if (!listing.value) return Promise.reject(new Error('No listing'))
  return listingService.uploadPhoto(listing.value.id, file, onProgress)
}

async function removePhoto(media: Media): Promise<void> {
  if (listing.value) await listingService.removePhoto(listing.value.id, media.id)
}
function onPhotosChange(next: Media[]) {
  if (listing.value) listing.value = { ...listing.value, photos: next }
  photoError.value = null
}

/* Confirm & pay */
const confirmOpen = ref(false)
const confirmed = ref(false)
const confirmError = ref<string | null>(null)
const submitting = ref(false)

function openConfirm() {
  if (!listing.value?.photos.length) {
    photoError.value = 'Upload at least one photo so buyers and tenants can see your property.'
    return
  }
  confirmed.value = false
  confirmError.value = null
  confirmOpen.value = true
}

async function confirmAndPay() {
  if (!listing.value) return
  if (!confirmed.value) {
    confirmError.value = 'Please confirm the details are accurate.'
    return
  }
  submitting.value = true
  try {
    await listingService.submit(listing.value.id, { confirm_accuracy: true })
    await pay('listing_fee', listing.value.id, 'card')
  } catch (e) {
    ui.apiError(e)
  } finally {
    submitting.value = false
  }
}

const stepIndex = computed(() => (step.value === 'details' ? 0 : 1))
</script>

<template>
  <div class="lp">
    <div class="container lp__inner">
      <AppBackLink v-if="step === 'photos' || isEdit" :fallback="isEdit ? '/dashboard/property-management' : '/property-management'" class="lp__back" />
      <AppStepper :steps="['Property details', 'Upload photos', 'Pay listing fee']" :current="stepIndex" compact align="center" class="lp__stepper" />

      <div v-if="loadingListing && !listing" class="lp__card"><AppSkeleton :lines="10" height="20px" /></div>
      <AppErrorState v-else-if="loadError" :error="loadError" @retry="loadListing" />

      <!-- STEP 1: details -->
      <template v-else-if="step === 'details'">
        <header class="lp__head">
          <h1 class="lp__title">{{ isEdit ? 'Edit your property' : 'Tell us about your property' }}</h1>
          <p class="lp__subtitle">Fill in the details below so we can list your property for the right audience.</p>
        </header>
        <form id="listing-form" class="lp__card lp__form" novalidate @submit.prevent="saveDetails">
          <AppAlert v-if="form.errors._form" tone="danger">{{ form.errors._form }}</AppAlert>
          <AppChoiceChips v-model="form.values.listing_type" label="Listing Type" :options="LISTING_TYPE_OPTIONS" />
          <AppChoiceChips v-model="form.values.property_type" label="Property Type" :options="PROPERTY_TYPE_OPTIONS" />
          <div class="lp__row lp__row--2">
            <AppSelect v-model="form.values.state" label="State" placeholder="Select state" size="lg" :options="lookups.states" :loading="lookups.loading" :error="form.errors.state" @update:model-value="form.values.city = ''" />
            <AppSelect v-if="cityOptions.length" v-model="form.values.city" label="City/Area" placeholder="Select city" size="lg" :options="cityOptions" :disabled="!form.values.state" :error="form.errors.city" />
            <AppInput v-else v-model="form.values.city" label="City/Area" placeholder="Enter city or area" size="lg" :disabled="!form.values.state" :error="form.errors.city" @blur="form.touch('city')" />
          </div>
          <AppInput v-model="form.values.address" label="Property Address" placeholder="Enter property address" autocomplete="street-address" size="lg" :error="form.errors.address" @blur="form.touch('address')" />
          <div class="lp__row lp__row--3">
            <AppInput v-model="form.values.size_sqm" label="Property Size (sqm)" type="number" inputmode="numeric" placeholder="e.g. 250" size="lg" :error="form.errors.size_sqm" @blur="form.touch('size_sqm')" />
            <AppInput v-model="form.values.bedrooms" label="Number of Bedrooms" type="number" inputmode="numeric" placeholder="Enter number" size="lg" />
            <AppInput v-model="form.values.bathrooms" label="Number of Bathrooms" type="number" inputmode="numeric" placeholder="Enter number" size="lg" />
          </div>
          <AppCurrencyInput
            v-model="form.values.asking_price"
            label="Asking Price"
            placeholder="Enter asking price"
            size="lg"
            :error="form.errors.asking_price"
            hint="For rent, enter the annual rent amount."
            @blur="form.touch('asking_price')"
          />
          <AppChoiceChips v-model="form.values.condition" label="Property Condition" :options="CONDITION_OPTIONS" />
          <AppChoiceChips v-model="form.values.furnishing" label="Furnishing Status" :options="FURNISHING_OPTIONS" />
          <AppChoiceChips v-model="form.values.amenities" label="Amenities" multiple :options="AMENITY_OPTIONS" />
          <AppTextarea v-model="form.values.description" label="Description" optional placeholder="Describe the property, neighbourhood and anything buyers or tenants should know" :maxlength="2000" />
        </form>
        <div class="lp__actions">
          <AppButton type="submit" form="listing-form" size="lg" block :loading="form.submitting">
            {{ isEdit ? 'Save changes' : 'Continue to upload photos' }}
          </AppButton>
        </div>
      </template>

      <!-- STEP 2: photos -->
      <template v-else-if="step === 'photos' && listing">
        <header class="lp__head">
          <h1 class="lp__title">Upload photos</h1>
          <p class="lp__subtitle">Add photos to make your listing stand out, then pay the one-time registration fee.</p>
        </header>
        <div class="lp__card">
          <AppAlert v-if="photoError" tone="danger" dismissible class="lp__photo-error" @dismiss="photoError = null">{{ photoError }}</AppAlert>
          <PhotoUploader
            :photos="listing.photos"
            :upload="uploadPhoto"
            :remove="removePhoto"
            @change="onPhotosChange"
            @error="photoError = $event"
          />
        </div>
        <div class="lp__actions lp__actions--split">
          <AppButton variant="outline" size="lg" :to="{ query: { listing: listing.id } }">Back</AppButton>
          <AppButton size="lg" @click="openConfirm">Continue to payment</AppButton>
        </div>
      </template>
    </div>

    <AppModal v-model:open="confirmOpen" size="sm" hide-close :persistent="submitting || processing" class="confirm">
      <div class="confirm__body">
        <span class="confirm__icon" aria-hidden="true"><AppIcon name="badge-check" :size="28" /></span>
        <h2 class="confirm__title">Confirm &amp; proceed to payment</h2>
        <p class="confirm__lead">Before we publish your listing, please confirm the following:</p>
        <AppCheckbox v-model="confirmed" :error="confirmError" class="confirm__check">
          I confirm that all property details and photos provided are accurate and truthful. Misleading listings may be removed.
        </AppCheckbox>
        <p class="confirm__terms">
          By clicking Continue, you agree to AMCOM's <RouterLink to="/legal/terms-of-service">Terms of Service</RouterLink> and
          <RouterLink to="/legal/privacy-policy">privacy policy</RouterLink>.
          <template v-if="fee"> A one-time registration fee of <strong>{{ formatNaira(fee.amount) }}</strong> applies.</template>
        </p>
        <div class="confirm__actions">
          <AppButton variant="secondary" size="lg" :disabled="submitting || processing" @click="confirmOpen = false">Cancel</AppButton>
          <AppButton size="lg" :loading="submitting || processing" @click="confirmAndPay">Continue</AppButton>
        </div>
        <p class="confirm__secure"><AppIcon name="lock" :size="14" /> You will be securely redirected to Paystack to complete this transaction.</p>
      </div>
    </AppModal>
  </div>
</template>

<style scoped>
.lp {
  flex: 1;
  padding: 32px 0 96px;
}

.lp__inner {
  max-width: calc(736px + var(--gutter) * 2);
}

.lp__back {
  margin-bottom: 24px;
}

.lp__stepper {
  margin-bottom: 40px;
}

.lp__head {
  text-align: center;
  margin-bottom: 40px;
}

.lp__title {
  font-size: 2rem;
  font-weight: 700;
}

.lp__subtitle {
  margin-top: 12px;
  font-size: var(--text-base);
  color: var(--color-muted);
}

.lp__card {
  padding: 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
}

.lp__form {
  display: grid;
  gap: 28px;
}

.lp__row {
  display: grid;
  gap: 24px;
}

.lp__row--2 {
  grid-template-columns: 1fr 1fr;
}

.lp__row--3 {
  grid-template-columns: repeat(3, 1fr);
}

.lp__actions {
  margin: 52px auto 0;
  max-width: 660px;
}

.lp__actions--split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  max-width: none;
}

.lp__photo-error {
  margin-bottom: 16px;
}

.confirm__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 8px 0 0;
  text-align: center;
}

.confirm__icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-success-bg);
  color: var(--color-primary);
}

.confirm__title {
  margin-top: 6px;
  font-size: var(--text-xl);
  font-weight: 500;
}

.confirm__lead {
  font-size: var(--text-sm);
  color: var(--color-body);
}

.confirm__check {
  margin: 18px 0;
  text-align: left;
}

.confirm__terms {
  width: 100%;
  padding-top: 18px;
  border-top: 1px solid var(--color-border);
  font-size: var(--text-xs);
  color: var(--color-body);
}

.confirm__terms a {
  color: var(--color-primary);
}

.confirm__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
  margin-top: 12px;
}

.confirm__secure {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-xs);
  color: var(--color-body);
}

@media (max-width: 767px) {
  .lp {
    padding-top: 24px;
  }

  .lp__stepper {
    margin-bottom: 24px;
  }

  .lp__head {
    text-align: left;
    margin-bottom: 20px;
  }

  .lp__title {
    font-size: var(--text-xl);
    font-weight: 500;
  }

  .lp__subtitle {
    margin-top: 6px;
    font-size: var(--text-sm);
  }

  .lp__card {
    padding: 0;
    border: 0;
  }

  .lp__form {
    gap: 20px;
  }

  .lp__row--2,
  .lp__row--3 {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .lp__actions {
    margin-top: 32px;
  }
}
</style>
