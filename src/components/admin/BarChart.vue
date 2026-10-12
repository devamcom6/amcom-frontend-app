<script setup lang="ts">
import { computed, ref } from 'vue'

/**
 * Single-series column chart (SVG). One hue (brand primary), thin bars with rounded
 * data-ends anchored to the baseline, a recessive grid, a per-bar hover tooltip and
 * a visually-hidden data table for screen readers.
 */
const props = withDefaults(
  defineProps<{
    data: { label: string; value: number }[]
    title: string
    format?: (v: number) => string
    height?: number
  }>(),
  { height: 220, format: (v: number) => v.toLocaleString('en-NG') },
)

const W = 640
const PAD = { top: 12, right: 8, bottom: 28, left: 8 }
const max = computed(() => Math.max(1, ...props.data.map((d) => d.value)))
const ticks = computed(() => [0.25, 0.5, 0.75, 1].map((f) => f * max.value))
const plotH = computed(() => props.height - PAD.top - PAD.bottom)
const band = computed(() => (W - PAD.left - PAD.right) / Math.max(1, props.data.length))
const barW = computed(() => Math.max(6, Math.min(28, band.value * 0.55)))
const hover = ref<number | null>(null)

function y(v: number) {
  return PAD.top + plotH.value - (v / max.value) * plotH.value
}

/** Rect path with 4px rounded top corners only (anchored to the baseline). */
function barPath(i: number, v: number) {
  const x = PAD.left + i * band.value + (band.value - barW.value) / 2
  const top = y(v)
  const base = PAD.top + plotH.value
  const h = Math.max(0, base - top)
  const r = Math.min(4, h, barW.value / 2)
  return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW.value - r} Q${x + barW.value},${top} ${x + barW.value},${top + r} V${base} Z`
}

const tip = computed(() => {
  if (hover.value === null) return null
  const d = props.data[hover.value]
  if (!d) return null
  const x = PAD.left + hover.value * band.value + band.value / 2
  return { d, left: `${(x / W) * 100}%`, top: `${(y(d.value) / props.height) * 100}%` }
})
</script>

<template>
  <figure class="chart">
    <div class="chart__plot">
      <svg :viewBox="`0 0 ${W} ${height}`" preserveAspectRatio="none" role="img" :aria-label="title" @mouseleave="hover = null">
        <g class="chart__grid">
          <line v-for="t in ticks" :key="t" :x1="PAD.left" :x2="W - PAD.right" :y1="y(t)" :y2="y(t)" />
          <line class="chart__base" :x1="PAD.left" :x2="W - PAD.right" :y1="PAD.top + plotH" :y2="PAD.top + plotH" />
        </g>
        <g v-for="(d, i) in data" :key="d.label">
          <path :d="barPath(i, d.value)" class="chart__bar" :class="{ 'is-dim': hover !== null && hover !== i }" />
          <!-- Hit target taller and wider than the mark -->
          <rect
            :x="PAD.left + i * band"
            :y="PAD.top"
            :width="band"
            :height="plotH"
            fill="transparent"
            tabindex="0"
            :aria-label="`${d.label}: ${format(d.value)}`"
            @mouseenter="hover = i"
            @focus="hover = i"
            @blur="hover = null"
          />
        </g>
      </svg>
      <div v-if="tip" class="chart__tip" :style="{ left: tip.left, top: tip.top }" role="status">
        <span class="chart__tip-label">{{ tip.d.label }}</span>
        <strong>{{ format(tip.d.value) }}</strong>
      </div>
    </div>
    <div class="chart__axis" aria-hidden="true">
      <span v-for="(d, i) in data" :key="d.label" :class="{ 'is-hidden': data.length > 8 && i % 2 === 1 }">{{ d.label }}</span>
    </div>
    <table class="sr-only">
      <caption>{{ title }}</caption>
      <thead><tr><th scope="col">Period</th><th scope="col">Value</th></tr></thead>
      <tbody><tr v-for="d in data" :key="d.label"><th scope="row">{{ d.label }}</th><td>{{ format(d.value) }}</td></tr></tbody>
    </table>
  </figure>
</template>

<style scoped>
.chart {
  margin: 0;
}

.chart__plot {
  position: relative;
}

.chart svg {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 640 / 220;
}

.chart__grid line {
  stroke: #eceef0;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.chart__grid .chart__base {
  stroke: #cfd4d8;
}

.chart__bar {
  fill: var(--color-primary);
  transition: opacity var(--duration-fast) var(--ease);
}

.chart__bar.is-dim {
  opacity: 0.45;
}

rect:focus {
  outline: none;
}

.chart__tip {
  position: absolute;
  z-index: 2;
  display: grid;
  gap: 2px;
  padding: 8px 10px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
  transform: translate(-50%, calc(-100% - 10px));
  pointer-events: none;
  white-space: nowrap;
  font-size: var(--text-sm);
  color: var(--color-ink);
}

.chart__tip-label {
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.chart__axis {
  display: flex;
  justify-content: space-around;
  margin-top: 6px;
  font-size: 11px;
  color: var(--color-muted);
}

.chart__axis span {
  flex: 1;
  text-align: center;
  white-space: nowrap;
}

.chart__axis .is-hidden {
  visibility: hidden;
}
</style>
