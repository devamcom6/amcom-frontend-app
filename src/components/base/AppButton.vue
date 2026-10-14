<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import AppIcon from './AppIcon.vue'
import AppSpinner from './AppSpinner.vue'
import type { IconName } from './icons'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'outline' | 'secondary' | 'ghost' | 'link' | 'danger' | 'danger-soft' | 'white'
    size?: 'sm' | 'md' | 'lg'
    type?: 'button' | 'submit' | 'reset'
    to?: RouteLocationRaw
    href?: string
    block?: boolean
    loading?: boolean
    disabled?: boolean
    iconLeft?: IconName
    iconRight?: IconName
    /** Text announced while `loading` is true. */
    loadingLabel?: string
  }>(),
  { variant: 'primary', size: 'md', type: 'button', loadingLabel: 'Please wait' },
)

const tag = computed(() => (props.to ? 'RouterLink' : props.href ? 'a' : 'button'))
const isDisabled = computed(() => props.disabled || props.loading)

// Only bind the attributes that belong to the rendered element. Passing `href` (even undefined)
// to RouterLink would override the URL it computes, leaving the <a> without an href.
const tagAttrs = computed(() => {
  if (tag.value === 'RouterLink') return { to: props.to }
  if (tag.value === 'a') return { href: props.href }
  return { type: props.type, disabled: isDisabled.value }
})
/** Links can't be natively disabled — swallow clicks so a disabled link-button doesn't navigate. */
function blockIfDisabled(e: MouseEvent) {
  if (isDisabled.value && tag.value !== 'button') {
    e.preventDefault()
    e.stopImmediatePropagation()
  }
}
const iconSize = computed(() => (props.size === 'sm' ? 16 : 18))
</script>

<template>
  <component
    :is="tag"
    class="btn"
    :class="[`btn--${variant}`, `btn--${size}`, { 'btn--block': block, 'is-loading': loading }]"
    v-bind="tagAttrs"
    :aria-disabled="isDisabled || undefined"
    :aria-busy="loading || undefined"
    :tabindex="tag !== 'button' && isDisabled ? -1 : undefined"
    @click.capture="blockIfDisabled"
  >
    <AppSpinner v-if="loading" :size="iconSize - 2" :label="loadingLabel" />
    <AppIcon v-else-if="iconLeft" :name="iconLeft" :size="iconSize" />
    <span class="btn__label"><slot /></span>
    <AppIcon v-if="iconRight && !loading" :name="iconRight" :size="iconSize" />
  </component>
</template>

<style scoped>
.btn {
  --btn-bg: var(--color-primary);
  --btn-fg: var(--color-inverse);
  --btn-border: var(--color-primary);
  --btn-bg-hover: var(--color-primary-hover);
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 10px 24px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--btn-border);
  background: var(--btn-bg);
  color: var(--btn-fg);
  font-weight: 500;
  font-size: var(--text-sm);
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
  transition:
    background-color var(--duration-fast) var(--ease),
    border-color var(--duration-fast) var(--ease),
    color var(--duration-fast) var(--ease),
    box-shadow var(--duration-fast) var(--ease),
    transform var(--duration-fast) var(--ease);
  -webkit-tap-highlight-color: transparent;
}

.btn:hover:not(:disabled):not([aria-disabled='true']) {
  background: var(--btn-bg-hover);
}

.btn:active:not(:disabled):not([aria-disabled='true']) {
  transform: translateY(1px);
}

.btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.btn:disabled,
.btn[aria-disabled='true'] {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn.is-loading {
  opacity: 0.85;
  cursor: progress;
}

.btn--sm {
  min-height: 36px;
  padding: 7px 16px;
  font-size: var(--text-sm);
}

.btn--lg {
  min-height: 52px;
  padding: 14px 28px;
  font-size: var(--text-base);
}

.btn--block {
  display: flex;
  width: 100%;
}

.btn--outline {
  --btn-bg: transparent;
  --btn-fg: var(--color-primary);
  --btn-border: var(--color-primary);
  --btn-bg-hover: var(--color-primary-soft);
}

.btn--secondary {
  --btn-bg: var(--color-bg);
  --btn-fg: var(--color-ink);
  --btn-border: var(--color-border);
  --btn-bg-hover: var(--color-page);
}

.btn--ghost {
  --btn-bg: transparent;
  --btn-fg: var(--color-ink);
  --btn-border: transparent;
  --btn-bg-hover: var(--color-neutral-bg);
}

.btn--white {
  --btn-bg: var(--color-bg);
  --btn-fg: var(--color-ink);
  --btn-border: transparent;
  --btn-bg-hover: var(--color-page);
}

.btn--link {
  --btn-bg: transparent;
  --btn-fg: var(--color-primary);
  --btn-border: transparent;
  --btn-bg-hover: transparent;
  min-height: auto;
  padding: 4px 0;
}

.btn--link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.btn--danger {
  --btn-bg: var(--color-danger-strong);
  --btn-fg: var(--color-inverse);
  --btn-border: var(--color-danger-strong);
  --btn-bg-hover: #991b1b;
}

.btn--danger-soft {
  --btn-bg: var(--color-danger-bg);
  --btn-fg: var(--color-danger);
  --btn-border: var(--color-danger-bg);
  --btn-bg-hover: #fbd5d5;
}

.btn__label {
  display: inline-flex;
  align-items: center;
}
</style>
