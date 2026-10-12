<script setup lang="ts">
export type BadgeTone = 'success' | 'success-solid' | 'warning' | 'danger' | 'neutral' | 'info' | 'primary' | 'outline-success'

withDefaults(defineProps<{ tone?: BadgeTone; size?: 'sm' | 'md' }>(), { tone: 'neutral', size: 'md' })
</script>

<template>
  <span class="badge" :class="[`badge--${tone}`, `badge--${size}`]"><slot /></span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
}

.badge--sm {
  padding: 2px 10px;
  font-size: 11px;
}

.badge--success {
  background: var(--color-success-bg);
  color: var(--color-success-strong);
}

.badge--success-solid {
  background: var(--color-badge-green);
  color: var(--color-badge-green-text);
}

.badge--outline-success {
  background: var(--color-success-bg);
  color: var(--color-success-strong);
  border: 1px solid var(--color-success-border);
}

.badge--warning {
  background: var(--color-warning-soft);
  color: var(--color-warning);
  border: 1px solid #fcd9a6;
}

.badge--danger {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.badge--neutral {
  background: var(--color-neutral-bg);
  color: #4b5563;
}

.badge--info {
  background: #eaf1ff;
  color: #1d4ed8;
}

.badge--primary {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}
</style>
