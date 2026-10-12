<script setup lang="ts">
const ORDINALS = ['STEP ONE', 'STEP TWO', 'STEP THREE', 'STEP FOUR', 'STEP FIVE', 'STEP SIX']

withDefaults(defineProps<{ title?: string; steps: { title: string; text: string }[]; titleTone?: 'ink' | 'maroon' }>(), {
  title: 'How it works',
  titleTone: 'ink',
})
</script>

<template>
  <section id="how-it-works" class="how section section--grey" aria-labelledby="how-title">
    <div class="container">
      <h2 id="how-title" class="section-title" :class="{ 'section-title--maroon': titleTone === 'maroon' }">{{ title }}</h2>
      <ol class="how__grid" role="list">
        <li v-for="(step, i) in steps" :key="step.title" class="how__card">
          <p class="how__ordinal">{{ ORDINALS[i] }}</p>
          <h3 class="how__title">{{ step.title }}</h3>
          <p class="how__text">{{ step.text }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.how__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-top: 44px;
}

.how__card {
  padding: 28px 32px 26px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
}

.how__ordinal {
  font-size: var(--text-lg);
  letter-spacing: 0.01em;
  color: var(--color-muted);
}

.how__title {
  margin-top: 18px;
  font-size: var(--text-lg);
  font-weight: 500;
  color: var(--color-ink);
}

.how__text {
  margin-top: 8px;
  font-size: var(--text-sm);
  line-height: 1.7;
  letter-spacing: 0.01em;
  color: var(--color-body);
}

@media (max-width: 767px) {
  .how__grid {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-top: 28px;
  }
  .how__card {
    padding: 22px 16px;
  }
  .how__title {
    margin-top: 12px;
  }
}
</style>
