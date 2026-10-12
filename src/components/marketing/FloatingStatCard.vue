<script setup lang="ts">
/** Frosted "LIVE RETURNS ₦10M → ₦12M" card overlapping hero imagery. */
defineProps<{
  eyebrow: string
  headline: string
  stats: { label: string; value: string }[]
}>()
</script>

<template>
  <div class="stat-card">
    <div class="stat-card__top">
      <span class="stat-card__eyebrow">{{ eyebrow }}</span>
      <span class="stat-card__dot" aria-hidden="true" />
    </div>
    <p class="stat-card__headline">{{ headline }}</p>
    <dl class="stat-card__stats">
      <div v-for="s in stats" :key="s.label" class="stat-card__stat">
        <dt>{{ s.label }}</dt>
        <dd>{{ s.value }}</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.stat-card {
  width: 300px;
  padding: 20px 20px 18px;
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(14px) saturate(140%);
  box-shadow: 0 18px 40px rgba(16, 24, 40, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.7);
}

.stat-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-card__eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #29440f;
}

.stat-card__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-lime);
  box-shadow: 0 0 0 0 rgba(109, 186, 58, 0.5);
  animation: pulse 2.4s ease-out infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(109, 186, 58, 0.45);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(109, 186, 58, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(109, 186, 58, 0);
  }
}

.stat-card__headline {
  margin: 14px 0 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  font-family: var(--font-serif);
  font-size: 24px;
  color: var(--color-maroon);
}

.stat-card__stats {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 0;
}

.stat-card__stat:last-child {
  text-align: right;
}

.stat-card__stat dt {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--color-muted);
}

.stat-card__stat dd {
  margin: 2px 0 0;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-maroon);
}

@media (max-width: 767px) {
  .stat-card {
    width: auto;
    padding: 14px 16px;
  }
  .stat-card__headline {
    font-size: 20px;
    margin: 10px 0 8px;
    padding-bottom: 8px;
  }
}
</style>
