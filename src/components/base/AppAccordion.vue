<script setup lang="ts">
import { ref, useId } from 'vue'

/** FAQ accordion with +/− circular toggles. First item opens by default. */
const props = withDefaults(defineProps<{ items: { id: number | string; question: string; answer: string }[]; defaultOpen?: number[] }>(), {
  defaultOpen: () => [0],
})

const uid = useId()
const open = ref<Set<number>>(new Set(props.defaultOpen))

function toggle(i: number) {
  const next = new Set(open.value)
  if (next.has(i)) next.delete(i)
  else next.add(i)
  open.value = next
}
</script>

<template>
  <div class="accordion">
    <div v-for="(item, i) in items" :key="item.id" class="accordion__item" :class="{ 'is-open': open.has(i) }">
      <h3 class="accordion__heading">
        <button
          :id="`${uid}-q-${i}`"
          type="button"
          class="accordion__trigger"
          :aria-expanded="open.has(i)"
          :aria-controls="`${uid}-a-${i}`"
          @click="toggle(i)"
        >
          <span>{{ item.question }}</span>
          <span class="accordion__icon" aria-hidden="true">{{ open.has(i) ? '−' : '+' }}</span>
        </button>
      </h3>
      <div
        v-show="open.has(i)"
        :id="`${uid}-a-${i}`"
        class="accordion__panel"
        role="region"
        :aria-labelledby="`${uid}-q-${i}`"
      >
        <p>{{ item.answer }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.accordion__item {
  border-bottom: 1px solid var(--color-ink);
}

.accordion__item.is-open {
  border-bottom-color: transparent;
}

.accordion__heading {
  font-size: inherit;
  font-weight: inherit;
}

.accordion__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
  padding: 28px 0 22px;
  text-align: left;
  font-size: var(--text-md);
  color: var(--color-ink);
}

.accordion__trigger:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primary);
  border-radius: var(--radius-xs);
}

.accordion__icon {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-ink);
  border-radius: 50%;
  font-size: 18px;
  line-height: 1;
  color: var(--color-primary);
  flex-shrink: 0;
}

.accordion__panel {
  padding-bottom: 28px;
  color: var(--color-body);
  line-height: 1.6;
}

@media (max-width: 767px) {
  .accordion__trigger {
    padding: 20px 0 16px;
    font-size: var(--text-base);
  }
}
</style>
