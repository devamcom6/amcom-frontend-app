<script setup lang="ts">
import AppIcon from '@/components/base/AppIcon.vue'
import type { IconName } from '@/components/base/icons'

withDefaults(
  defineProps<{ title: string; items: { icon: IconName; title: string; text: string }[]; tone?: 'ink' | 'maroon' }>(),
  { tone: 'ink' },
)
</script>

<template>
  <section class="why section section--grey" aria-labelledby="why-title">
    <div class="container">
      <h2 id="why-title" class="section-title" :class="{ 'section-title--maroon': tone === 'maroon' }">{{ title }}</h2>
      <ol class="why__grid" role="list">
        <li v-for="(item, i) in items" :key="item.title" class="why__item">
          <p class="why__num">{{ String(i + 1).padStart(2, '0') }}</p>
          <h3 class="why__title" :class="{ 'why__title--maroon': tone === 'maroon' }">
            <span class="why__icon" :class="{ 'why__icon--maroon': tone === 'maroon' }"><AppIcon :name="item.icon" :size="20" /></span>
            {{ item.title }}
          </h3>
          <p class="why__text">{{ item.text }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.why__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 56px;
}

.why__item {
  padding: 0 40px;
}

.why__item:first-child {
  padding-left: 0;
}

.why__item + .why__item {
  border-left: 1px solid #c9c9c9;
}

.why__num {
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.why__title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 22px;
  font-size: var(--text-xl);
  font-weight: 500;
  color: var(--color-ink);
}

.why__title--maroon {
  color: var(--color-maroon);
}

.why__icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: #fbfaf6;
  color: var(--color-muted);
  flex-shrink: 0;
}

.why__icon--maroon {
  color: #a0472b;
}

.why__text {
  margin-top: 26px;
  font-size: var(--text-base);
  line-height: 1.75;
  color: var(--color-body);
}

@media (max-width: 899px) {
  .why__grid {
    grid-template-columns: 1fr;
    margin-top: 32px;
  }

  .why__item,
  .why__item:first-child {
    padding: 24px 0;
  }

  .why__item:first-child {
    padding-top: 0;
  }

  .why__item + .why__item {
    border-left: 0;
    border-top: 1px solid #c9c9c9;
  }

  .why__title {
    margin-top: 16px;
  }

  .why__text {
    margin-top: 18px;
    font-size: var(--text-sm);
  }
}
</style>
