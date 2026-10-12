<script setup lang="ts">
import { ref, watch } from 'vue'
import AppAlert from '@/components/base/AppAlert.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppConfirmDialog from '@/components/base/AppConfirmDialog.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppModal from '@/components/base/AppModal.vue'
import AppSelect from '@/components/base/AppSelect.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import AppSpinner from '@/components/base/AppSpinner.vue'
import { useAsync } from '@/composables/useAsync'
import { useForm } from '@/composables/useForm'
import { profileService } from '@/services/api'
import { toApiError } from '@/services/http/errors'
import { useLookupStore } from '@/stores/lookups'
import { useUiStore } from '@/stores/ui'
import type { PayoutAccount } from '@/types'
import { pattern, required } from '@/utils/validators'

/**
 * Bank details for payouts. Laravel resolves the account name via Paystack's
 * "Resolve Account Number" API (secret key server-side) before saving.
 */
const ui = useUiStore()
const lookups = useLookupStore()
void lookups.ensure()
const { data: accounts, loading, error, execute } = useAsync(() => profileService.payoutAccounts())

const open = ref(false)
const resolvedName = ref<string | null>(null)
const resolving = ref(false)
const form = useForm(
  { bank_code: '', account_number: '' },
  { rules: { bank_code: [required('Select your bank.')], account_number: [required('Enter your account number.'), pattern(/^\d{10}$/, 'Account number must be 10 digits.')] } },
)

watch(
  () => [form.values.bank_code, form.values.account_number],
  async ([bank, number]) => {
    resolvedName.value = null
    if (!bank || !/^\d{10}$/.test(String(number))) return
    resolving.value = true
    try {
      resolvedName.value = (await profileService.resolveBankAccount({ bank_code: String(bank), account_number: String(number) })).account_name
      delete form.errors.account_number
    } catch (e) {
      form.errors.account_number = toApiError(e).fieldError('account_number') ?? "We couldn't verify this account number."
    } finally {
      resolving.value = false
    }
  },
)

async function save() {
  if (!resolvedName.value) {
    form.validate()
    return
  }
  try {
    const acct = await form.submit(() => profileService.addPayoutAccount(form.values))
    if (acct) {
      accounts.value = [...(accounts.value ?? []), acct]
      open.value = false
      form.reset()
      ui.success('Payout account added')
    }
  } catch (e) {
    ui.apiError(e)
  }
}

const removing = ref<PayoutAccount | null>(null)
const removingBusy = ref(false)
async function remove() {
  if (!removing.value) return
  removingBusy.value = true
  try {
    await profileService.removePayoutAccount(removing.value.id)
    accounts.value = (accounts.value ?? []).filter((a) => a.id !== removing.value?.id)
    removing.value = null
    ui.success('Payout account removed')
  } catch (e) {
    ui.apiError(e)
  } finally {
    removingBusy.value = false
  }
}
</script>

<template>
  <div>
    <AppSkeleton v-if="loading && !accounts" height="200px" />
    <AppErrorState v-else-if="error" :error="error" @retry="execute" />

    <div v-else-if="!accounts?.length" class="empty">
      <span class="empty__icon" aria-hidden="true"><span><AppIcon name="wallet" :size="26" /></span></span>
      <h2 class="empty__title">No payout details yet</h2>
      <p class="empty__text">Add your bank account details so we can process your investment returns, rental income, and property sale payouts.</p>
      <AppButton @click="open = true">Add Payout Details</AppButton>
    </div>

    <template v-else>
      <div class="head">
        <div>
          <h2 class="head__title">Payout Details</h2>
          <p class="head__desc">Returns, rental income and sale proceeds are paid into your default account.</p>
        </div>
        <AppButton variant="outline" size="sm" icon-left="plus" @click="open = true">Add account</AppButton>
      </div>
      <ul class="accounts" role="list">
        <li v-for="a in accounts" :key="a.id" class="account">
          <span class="account__icon" aria-hidden="true"><AppIcon name="landmark" /></span>
          <div class="account__text">
            <span class="account__name">{{ a.account_name }}</span>
            <span class="account__meta">{{ a.bank_name }} · {{ a.account_number_masked }}</span>
          </div>
          <span v-if="a.is_default" class="account__default">Default</span>
          <button type="button" class="account__remove" :aria-label="`Remove ${a.bank_name} account`" @click="removing = a"><AppIcon name="trash" :size="18" /></button>
        </li>
      </ul>
    </template>

    <AppModal v-model:open="open" title="Add payout details" size="sm" :persistent="form.submitting">
      <form id="payout-form" class="stack" novalidate @submit.prevent="save">
        <AppAlert v-if="form.errors._form" tone="danger">{{ form.errors._form }}</AppAlert>
        <AppSelect v-model="form.values.bank_code" label="Bank" placeholder="Select bank" :options="lookups.banks" :loading="lookups.loading" :error="form.errors.bank_code" />
        <AppInput v-model="form.values.account_number" label="Account number" inputmode="numeric" maxlength="10" placeholder="10-digit NUBAN" :error="form.errors.account_number" />
        <p class="resolved" aria-live="polite">
          <template v-if="resolving"><AppSpinner :size="14" /> Verifying account…</template>
          <template v-else-if="resolvedName"><AppIcon name="check-circle" :size="16" /> {{ resolvedName }}</template>
        </p>
      </form>
      <template #footer>
        <AppButton type="submit" form="payout-form" block :loading="form.submitting" :disabled="!resolvedName">Save account</AppButton>
      </template>
    </AppModal>

    <AppConfirmDialog
      :open="!!removing"
      title="Remove payout account?"
      :message="`Payouts will no longer be sent to ${removing?.bank_name} ${removing?.account_number_masked}.`"
      confirm-label="Remove"
      tone="danger"
      :loading="removingBusy"
      @update:open="(v) => !v && (removing = null)"
      @confirm="remove"
    />
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 0 0 8px;
  text-align: center;
}

.empty__icon {
  display: grid;
  place-items: center;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: var(--color-success-bg);
}

.empty__icon span {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
}

.empty__title {
  margin-top: 16px;
  font-size: var(--text-lg);
  font-weight: 500;
}

.empty__text {
  max-width: 400px;
  margin-bottom: 8px;
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.head__title {
  font-size: var(--text-lg);
  font-weight: 500;
}

.head__desc {
  font-size: var(--text-sm);
  color: var(--color-body);
}

.accounts {
  display: grid;
  gap: 12px;
}

.account {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.account__icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-success-bg);
  color: var(--color-primary);
}

.account__text {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.account__name {
  font-weight: 600;
}

.account__meta {
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.account__default {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-primary);
}

.account__remove {
  color: var(--color-muted);
}

.account__remove:hover {
  color: var(--color-danger);
}

.stack {
  display: grid;
  gap: 16px;
}

.resolved {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 20px;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-primary);
}
</style>
