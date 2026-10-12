<script setup lang="ts">
import { clone } from '@/utils/clone'
import { computed, ref, watch } from 'vue'
import AppAlert from '@/components/base/AppAlert.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppCurrencyInput from '@/components/base/AppCurrencyInput.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppSelect from '@/components/base/AppSelect.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import AppToggle from '@/components/base/AppToggle.vue'
import { useAsync } from '@/composables/useAsync'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { adminService } from '@/services/api'
import { toApiError } from '@/services/http/errors'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { SystemSettings, ValidationErrors } from '@/types'

/** System configuration exposed by the backend. Editable only with `settings.manage` (super admin by default). */
const auth = useAuthStore()
const ui = useUiStore()
const canEdit = computed(() => auth.can('settings.manage'))
const { data, loading, error, execute } = useAsync(() => adminService.settings())

const draft = ref<SystemSettings | null>(null)
const baseline = ref('')
watch(data, (d) => {
  if (!d) return
  draft.value = clone(d)
  baseline.value = JSON.stringify(d)
})
const dirty = computed(() => !!draft.value && JSON.stringify(draft.value) !== baseline.value)
useUnsavedChanges(dirty)

const errors = ref<ValidationErrors>({})
const saving = ref(false)
async function save() {
  if (!draft.value) return
  saving.value = true
  errors.value = {}
  try {
    data.value = await adminService.saveSettings(draft.value)
    ui.success('Settings saved')
  } catch (e) {
    const err = toApiError(e)
    if (err.isValidation) errors.value = err.errors
    else ui.apiError(err)
  } finally {
    saving.value = false
  }
}

function discard() {
  if (data.value) draft.value = clone(data.value)
}

const err = (k: string) => errors.value[k]?.[0]
</script>

<template>
  <div>
    <AppSkeleton v-if="loading && !draft" :lines="10" height="24px" />
    <AppErrorState v-else-if="error" :error="error" @retry="execute" />
    <form v-else-if="draft" class="settings" novalidate @submit.prevent="save">
      <AppAlert v-if="!canEdit" tone="neutral">You can view these settings. Only a Super Admin can change them.</AppAlert>
      <fieldset :disabled="!canEdit" class="settings__fields">
        <section class="panel">
          <h2 class="panel__title">General</h2>
          <div class="grid">
            <AppInput v-model="draft.general.support_email" label="Support email" type="email" />
            <AppInput v-model="draft.general.support_phone" label="Support phone" type="tel" />
            <AppInput v-model="draft.general.office_address" label="Office address" class="full" />
            <AppToggle v-model="draft.general.maintenance_mode" class="full" label="Maintenance mode" description="Customers see a maintenance banner; payments and new orders are paused by the API." />
          </div>
        </section>

        <section class="panel">
          <h2 class="panel__title">Fees</h2>
          <div class="grid">
            <AppCurrencyInput v-model="draft.fees.listing_fee" label="Listing registration fee" :error="err('fees.listing_fee')" />
            <AppInput v-model.number="draft.fees.sale_service_fee_percent" label="Sale service fee (%)" type="number" inputmode="decimal" />
          </div>
        </section>

        <section class="panel">
          <h2 class="panel__title">Capital investment</h2>
          <div class="grid">
            <AppCurrencyInput v-model="draft.capital_investment.min_amount" label="Minimum amount" :error="err('capital_investment.min_amount')" />
            <AppCurrencyInput v-model="draft.capital_investment.max_self_serve_amount" label="Max self-serve amount" hint="Above this, customers are asked to contact the team." />
            <AppSelect
              v-model="draft.capital_investment.checkout_mode"
              label="Checkout mode"
              :options="[
                { value: 'direct', label: 'Sign agreement & pay online' },
                { value: 'interest', label: 'Interest only (agent follow-up)' },
              ]"
            />
          </div>
          <h3 class="panel__sub">Tenures</h3>
          <div v-for="(t, i) in draft.capital_investment.tenures" :key="i" class="tenure">
            <AppInput v-model.number="t.months" :label="`Tenure ${i + 1} (months)`" type="number" />
            <AppInput v-model.number="t.roi_percent" label="Return (%)" type="number" inputmode="decimal" />
          </div>
        </section>

        <section class="panel">
          <h2 class="panel__title">Notifications</h2>
          <div class="grid">
            <AppInput v-model="draft.notifications.admin_alert_email" label="Operations alert email" type="email" hint="Receives new-order, failed-payment and listing alerts (sent via ZeptoMail)." />
            <AppInput v-model.number="draft.notifications.send_maturity_reminders_days_before" label="Maturity reminder (days before)" type="number" />
          </div>
        </section>
      </fieldset>
      <div v-if="canEdit" class="actions">
        <AppButton variant="secondary" :disabled="!dirty || saving" @click="discard">Discard</AppButton>
        <AppButton type="submit" :loading="saving" :disabled="!dirty">Save settings</AppButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
.settings {
  display: grid;
  gap: 16px;
  max-width: 900px;
}

.settings__fields {
  display: grid;
  gap: 16px;
}

.panel {
  padding: 20px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
}

.panel__title {
  margin-bottom: 16px;
  font-size: var(--text-base);
  font-weight: 600;
}

.panel__sub {
  margin: 20px 0 12px;
  font-size: var(--text-sm);
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.full {
  grid-column: 1 / -1;
}

.tenure {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 12px;
}

.actions {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 0;
  background: var(--color-page);
}

@media (max-width: 767px) {
  .grid,
  .tenure {
    grid-template-columns: 1fr;
  }
}
</style>
