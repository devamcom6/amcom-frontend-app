<script setup lang="ts" generic="V extends string | number">
import { computed, nextTick, onBeforeUnmount, ref, useAttrs, useId, watch } from 'vue'
import type { Option } from '@/types'
import AppField from './AppField.vue'
import AppIcon from './AppIcon.vue'

defineOptions({ inheritAttrs: false })

/**
 * Searchable select (WAI-ARIA "select-only combobox" + filter input).
 *
 * - Trigger is a button; the panel holds a search field and a listbox.
 * - Keyboard: ↑/↓/Home/End move, Enter selects, Esc closes, typing on the closed
 *   trigger opens the panel pre-filled with that character.
 * - The panel is teleported to <body> and positioned with `fixed`, so it is never
 *   clipped by modals or scroll containers. On mobile it opens as a bottom sheet.
 * - `variant="filter"` is the compact pill used in toolbars; `emptyLabel` makes the
 *   empty value ('') a selectable "All …" option instead of a disabled placeholder.
 */
const props = withDefaults(
  defineProps<{
    options: Option<V>[]
    label?: string
    hint?: string
    error?: string | null
    placeholder?: string
    /** Selectable label for the empty value (e.g. "All statuses"). */
    emptyLabel?: string
    required?: boolean
    disabled?: boolean
    locked?: boolean
    loading?: boolean
    size?: 'sm' | 'md' | 'lg'
    variant?: 'field' | 'filter'
    searchPlaceholder?: string
    /** Overrides the text shown on the closed trigger (e.g. a compact code for a long option label). */
    triggerLabel?: string
    id?: string
    hideLabel?: boolean
  }>(),
  { size: 'md', variant: 'field', searchPlaceholder: 'Search…' },
)

const model = defineModel<V | null | ''>({ default: '' })
const emit = defineEmits<{ blur: [FocusEvent]; change: [V | ''] }>()

// `class`/`style` style the field wrapper (so grid utilities work); other attrs go to the trigger.
const attrs = useAttrs()
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const triggerAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs
  return rest
})

const autoId = useId()
const triggerId = computed(() => props.id ?? `sel-${autoId}`)
const listId = computed(() => `${triggerId.value}-list`)
const optionId = (i: number) => `${triggerId.value}-opt-${i}`

const open = ref(false)
const query = ref('')
const active = ref(0)
const trigger = ref<HTMLButtonElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)
const listEl = ref<HTMLElement | null>(null)
const pos = ref<{ top: number; left: number; width: number; above: boolean }>({ top: 0, left: 0, width: 0, above: false })

type Item = { value: V | ''; label: string }
const allItems = computed<Item[]>(() => [
  ...(props.emptyLabel !== undefined ? [{ value: '' as const, label: props.emptyLabel }] : []),
  ...props.options,
])

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
/** Matches ranked: label starts with the query → a word starts with it → contains it. Stable within a rank. */
const filtered = computed(() => {
  const q = normalize(query.value.trim())
  if (!q) return allItems.value
  const rank = (label: string) => {
    const l = normalize(label)
    if (l.startsWith(q)) return 0
    if (l.split(/[\s/(),.-]+/).some((w) => w.startsWith(q))) return 1
    return l.includes(q) ? 2 : -1
  }
  return allItems.value
    .map((o, i) => ({ o, i, r: rank(o.label) }))
    .filter((x) => x.r >= 0)
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.o)
})

const selected = computed(() => allItems.value.find((o) => o.value === model.value))
const isEmpty = computed(() => (model.value === '' || model.value === null) && props.emptyLabel === undefined)
const displayText = computed(() => {
  if (props.loading) return 'Loading…'
  if (props.triggerLabel) return props.triggerLabel
  return selected.value?.label ?? props.placeholder ?? 'Select'
})
const isDisabled = computed(() => props.disabled || props.locked || props.loading)

function place() {
  const el = trigger.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const panelH = 340
  const above = window.innerHeight - r.bottom < panelH && r.top > window.innerHeight - r.bottom
  pos.value = {
    top: above ? r.top - 6 : r.bottom + 6,
    left: Math.min(r.left, window.innerWidth - Math.max(r.width, 240) - 8),
    width: Math.max(r.width, props.variant === 'filter' ? 220 : r.width),
    above,
  }
}

async function openPanel(initial = '') {
  if (isDisabled.value || open.value) return
  query.value = initial
  place()
  open.value = true
  const idx = filtered.value.findIndex((o) => o.value === model.value)
  active.value = Math.max(0, idx)
  await nextTick()
  searchInput.value?.focus({ preventScroll: true })
  scrollActiveIntoView()
}

function closePanel(returnFocus = true) {
  if (!open.value) return
  open.value = false
  query.value = ''
  if (returnFocus) trigger.value?.focus({ preventScroll: true })
}

function choose(item: Item | undefined) {
  if (!item) return
  model.value = item.value
  emit('change', item.value)
  closePanel()
}

function scrollActiveIntoView() {
  void nextTick(() => listEl.value?.querySelector<HTMLElement>('.is-active')?.scrollIntoView({ block: 'nearest' }))
}

watch(query, () => {
  active.value = 0
})

function onSearchKey(e: KeyboardEvent) {
  const n = filtered.value.length
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      if (n) active.value = (active.value + 1) % n
      scrollActiveIntoView()
      break
    case 'ArrowUp':
      e.preventDefault()
      if (n) active.value = (active.value - 1 + n) % n
      scrollActiveIntoView()
      break
    case 'Home':
      if (!query.value) {
        e.preventDefault()
        active.value = 0
        scrollActiveIntoView()
      }
      break
    case 'End':
      if (!query.value) {
        e.preventDefault()
        active.value = Math.max(0, n - 1)
        scrollActiveIntoView()
      }
      break
    case 'Enter':
      e.preventDefault()
      choose(filtered.value[active.value])
      break
    case 'Escape':
      e.preventDefault()
      e.stopPropagation()
      closePanel()
      break
    case 'Tab':
      closePanel(false)
      break
  }
}

function onTriggerKey(e: KeyboardEvent) {
  if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
    e.preventDefault()
    void openPanel()
  } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault()
    void openPanel(e.key)
  }
}

function onOutside(e: PointerEvent) {
  const t = e.target as Node
  if (open.value && !panel.value?.contains(t) && !trigger.value?.contains(t)) closePanel(false)
}

function onViewportChange(e: Event) {
  // Ignore scrolling inside the panel itself.
  if (e.type === 'scroll' && panel.value?.contains(e.target as Node)) return
  if (open.value) place()
}

watch(open, (v) => {
  const method = v ? 'addEventListener' : 'removeEventListener'
  document[method]('pointerdown', onOutside as EventListener, true)
  window[method]('resize', onViewportChange)
  window[method]('scroll', onViewportChange, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onOutside as EventListener, true)
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('scroll', onViewportChange, true)
})
</script>

<template>
  <AppField v-bind="rootAttrs" :id="triggerId" :label="label" :hint="hint" :error="error" :required="required" :hide-label="hideLabel">
    <div
      class="select"
      :class="[`select--${size}`, `select--${variant}`, { 'is-invalid': !!error, 'is-locked': locked, 'is-empty': isEmpty, 'is-open': open }]"
    >
      <button
        :id="triggerId"
        ref="trigger"
        type="button"
        class="select__trigger"
        v-bind="triggerAttrs"
        role="combobox"
        aria-haspopup="listbox"
        :aria-expanded="open"
        :aria-controls="listId"
        :aria-required="required || undefined"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? `${triggerId}-error` : hint ? `${triggerId}-hint` : undefined"
        :aria-busy="loading || undefined"
        :disabled="isDisabled"
        @click="open ? closePanel() : openPanel()"
        @keydown="onTriggerKey"
        @blur="emit('blur', $event)"
      >
        <span class="select__value">{{ displayText }}</span>
        <AppIcon class="select__icon" :name="locked ? 'lock' : 'chevron-down'" :size="variant === 'filter' ? 16 : 18" />
      </button>
    </div>

    <Teleport to="body">
      <Transition name="select-pop">
        <div
          v-if="open"
          ref="panel"
          class="select-panel"
          :class="{ 'select-panel--above': pos.above }"
          :style="{ top: `${pos.top}px`, left: `${pos.left}px`, width: `${pos.width}px` }"
        >
          <span class="select-panel__handle" aria-hidden="true" />
          <label class="select-panel__search">
            <AppIcon name="search" :size="16" />
            <span class="sr-only">Search {{ label ?? 'options' }}</span>
            <input
              ref="searchInput"
              v-model="query"
              type="text"
              role="combobox"
              aria-autocomplete="list"
              :aria-controls="listId"
              aria-expanded="true"
              :aria-activedescendant="filtered.length ? optionId(active) : undefined"
              :placeholder="searchPlaceholder"
              autocomplete="off"
              spellcheck="false"
              @keydown="onSearchKey"
            />
          </label>
          <ul :id="listId" ref="listEl" class="select-panel__list" role="listbox" :aria-label="label ?? placeholder ?? 'Options'">
            <li
              v-for="(opt, i) in filtered"
              :id="optionId(i)"
              :key="String(opt.value)"
              role="option"
              class="select-panel__option"
              :class="{ 'is-active': i === active, 'is-selected': opt.value === model }"
              :aria-selected="opt.value === model"
              @pointermove="active = i"
              @click="choose(opt)"
            >
              <span>{{ opt.label }}</span>
              <AppIcon v-if="opt.value === model" name="check" :size="16" :stroke-width="2.5" />
            </li>
            <li v-if="!filtered.length" class="select-panel__empty" role="presentation">No matches for “{{ query }}”</li>
          </ul>
        </div>
      </Transition>
    </Teleport>
  </AppField>
</template>

<style scoped>
.select {
  position: relative;
}

.select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  padding: 0 14px 0 16px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-xs);
  background: var(--color-bg);
  font-size: var(--text-sm);
  color: var(--color-ink);
  text-align: left;
  transition:
    border-color var(--duration-fast) var(--ease),
    box-shadow var(--duration-fast) var(--ease);
}

.select--lg .select__trigger {
  min-height: 56px;
}

.select--sm .select__trigger {
  min-height: 36px;
}

.select__value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select.is-empty .select__value {
  color: var(--color-subtle);
}

.select__trigger:focus-visible,
.select.is-open .select__trigger {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.select__trigger:disabled {
  background: var(--color-neutral-bg);
}

.select.is-locked .select__value {
  color: var(--color-body);
}

.select.is-invalid .select__trigger {
  border-color: var(--color-danger);
}

.select__icon {
  color: var(--color-muted);
  transition: transform var(--duration) var(--ease);
}

.select.is-open .select__icon {
  transform: rotate(180deg);
}

/* Compact pill used in filter toolbars */
.select--filter .select__trigger {
  min-height: 38px;
  padding: 0 12px 0 16px;
  border-color: var(--color-border);
  border-radius: var(--radius-pill);
  white-space: nowrap;
}

.select--filter.select--sm .select__trigger {
  min-height: 32px;
  padding: 0 10px 0 12px;
  font-size: var(--text-xs);
}
</style>

<style>
/* Teleported panel (unscoped: rendered outside the component root). */
.select-panel {
  position: fixed;
  z-index: 65;
  display: flex;
  flex-direction: column;
  max-height: 340px;
  min-width: 200px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.select-panel--above {
  transform: translateY(-100%);
}

.select-panel__handle {
  display: none;
}

.select-panel__search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px;
  padding: 0 10px;
  height: 38px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
  background: var(--color-page);
  color: var(--color-muted);
  cursor: text;
}

.select-panel__search:focus-within {
  border-color: var(--color-primary);
}

.select-panel__search input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: var(--text-sm);
  color: var(--color-ink);
}

.select-panel__list {
  flex: 1;
  margin: 0;
  padding: 0 6px 6px;
  list-style: none;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.select-panel__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-ink);
  cursor: pointer;
}

.select-panel__option.is-active {
  background: var(--color-page);
}

.select-panel__option.is-selected {
  color: var(--color-primary);
  font-weight: 600;
}

.select-panel__empty {
  padding: 14px 10px;
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.select-pop-enter-active,
.select-pop-leave-active {
  transition: opacity var(--duration-fast) var(--ease);
}

.select-pop-enter-from,
.select-pop-leave-to {
  opacity: 0;
}

@media (max-width: 767px) {
  /* Bottom sheet on phones */
  .select-panel,
  .select-panel--above {
    top: auto !important;
    left: 0 !important;
    right: 0;
    bottom: 0;
    width: auto !important;
    max-height: 70vh;
    border-radius: 20px 20px 0 0;
    transform: none;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .select-panel__handle {
    display: block;
    width: 36px;
    height: 4px;
    margin: 10px auto 2px;
    border-radius: 999px;
    background: #d1d5db;
  }

  .select-panel__search {
    margin: 8px 16px;
    height: 44px;
  }

  .select-panel__search input {
    font-size: 16px; /* prevents iOS zoom on focus */
  }

  .select-panel__list {
    padding: 0 10px 12px;
  }

  .select-panel__option {
    padding: 14px 12px;
    font-size: var(--text-base);
  }
}
</style>
