<script setup lang="ts">
/** Beige breakdown box ("No. of plot / Plot price / Projected Return / Profit"). */
defineProps<{ rows: { label: string; value: string }[] }>()
</script>

<template>
  <dl class="quote" aria-live="polite">
    <div v-for="r in rows" :key="r.label" class="quote__row">
      <dt>{{ r.label }}</dt>
      <dd>{{ r.value }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.quote {
  display: grid;
  gap: 18px;
  margin: 0;
  padding: 20px 16px;
  background: var(--color-quote);
}

.quote__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: var(--text-sm);
}

.quote__row dt {
  color: var(--color-body);
}

.quote__row dd {
  margin: 0;
  font-weight: 600;
  color: var(--color-ink);
  font-variant-numeric: tabular-nums;
}
</style>
