<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/base/AppButton.vue'
import AppSuccessPanel from '@/components/base/AppSuccessPanel.vue'
import { COMPANY } from '@/constants/site'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const productLabel = computed(() => (route.query.product === 'capital_investment' ? 'our Capital Investment' : 'our Buyback investment'))
const reference = computed(() => (typeof route.query.ref === 'string' ? route.query.ref : null))
</script>

<template>
  <section class="submitted">
    <AppSuccessPanel title="Interest Submitted Successfully!" tone="maroon" class="submitted__panel">
      <p>
        Thank you for expressing interest in {{ productLabel }}. One of our agents will reach out to you within 24–48 hours to guide you
        through the next steps, including payment and documentation.
      </p>
      <p v-if="reference" class="submitted__ref">Reference: <strong>{{ reference }}</strong></p>
      <template #actions>
        <div class="submitted__actions">
          <AppButton variant="outline" to="/contact" class="hide-desktop">Contact us</AppButton>
          <AppButton v-if="auth.isAuthenticated" to="/dashboard">Go to Dashboard</AppButton>
          <AppButton v-else to="/">Explore other products</AppButton>
        </div>
      </template>
      <template #note>
        <p>What happens next?</p>
        <ul class="submitted__list">
          <li>An agent will contact you via phone or email</li>
          <li>They will walk you through the investment process</li>
          <li>Once payment is confirmed, your plot will be officially allocated</li>
        </ul>
      </template>
    </AppSuccessPanel>
    <p class="submitted__help">
      Need help? Email <a :href="`mailto:${COMPANY.supportEmail}`">{{ COMPANY.supportEmail }}</a> or call
      <a :href="`tel:${COMPANY.supportPhone.replace(/\s/g, '')}`">{{ COMPANY.supportPhone }}</a>
    </p>
  </section>
</template>

<style scoped>
.submitted {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 104px var(--gutter) 96px;
}

.submitted__panel {
  width: 100%;
  max-width: 600px;
}

.submitted__panel :deep(.success__illus) {
  margin-bottom: 64px;
}

.submitted__ref {
  margin-top: 8px;
  font-size: var(--text-sm);
}

.submitted__actions {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 12px;
}

.submitted__actions :deep(.btn) {
  min-height: 40px;
}

.submitted__list {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.submitted__list li::before {
  content: '• ';
}

.submitted__help {
  margin-top: 56px;
  font-size: var(--text-sm);
  text-align: center;
  color: var(--color-body);
}

.submitted__help a:hover {
  color: var(--color-primary);
}

@media (max-width: 767px) {
  .submitted {
    padding-top: 80px;
  }

  .submitted__panel :deep(.success__illus) {
    margin-bottom: 40px;
  }

  .submitted__panel :deep(.success__actions) {
    order: 3;
    margin-top: 48px;
  }

  .submitted__panel :deep(.success__note) {
    order: 2;
  }

  .submitted__actions :deep(.btn) {
    min-height: 50px;
    font-size: var(--text-base);
  }

  .submitted__help {
    margin-top: 32px;
  }
}
</style>
