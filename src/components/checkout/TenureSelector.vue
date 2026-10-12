<script setup lang="ts">
import { useId } from 'vue'
import AppOptionCard from '@/components/base/AppOptionCard.vue'
import type { TenureOption } from '@/types'

withDefaults(defineProps<{ tenures: TenureOption[]; label?: string; suffix?: string; error?: string | null }>(), {
  label: 'Select Tenure',
  suffix: 'ROI',
})
const model = defineModel<number | null>({ default: null })
const name = useId()
</script>

<template>
  <fieldset class="tenure">
    <legend class="tenure__legend">{{ label }}</legend>
    <div class="tenure__grid" role="radiogroup">
      <AppOptionCard
        v-for="t in tenures"
        :key="t.months"
        v-model="model"
        :name="name"
        :value="t.months"
        :title="`${t.months} months`"
        :subtitle="`${t.roi_percent}% ${suffix}`"
      />
    </div>
    <p v-if="error" class="tenure__error" role="alert">{{ error }}</p>
  </fieldset>
</template>

<style scoped>
.tenure__legend {
  margin-bottom: 16px;
  font-size: var(--text-sm);
  color: var(--color-ink);
}

.tenure__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.tenure__error {
  margin-top: 8px;
  font-size: var(--text-xs);
  color: var(--color-danger);
}
</style>
