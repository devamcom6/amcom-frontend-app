<script setup lang="ts">
defineProps<{ title: string; description?: string; id?: string }>()
</script>

<template>
  <section class="ssec" :aria-labelledby="id">
    <header class="ssec__head">
      <div>
        <h2 :id="id" class="ssec__title"><slot name="title">{{ title }}</slot></h2>
        <p v-if="description" class="ssec__desc">{{ description }}</p>
      </div>
      <slot name="aside" />
    </header>
    <slot />
  </section>
</template>

<style scoped>
.ssec + .ssec {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid var(--color-border);
}

.ssec__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.ssec__title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: var(--text-lg);
  font-weight: 500;
}

.ssec__desc {
  margin-top: 4px;
  font-size: var(--text-sm);
  color: var(--color-body);
}

@media (max-width: 767px) {
  .ssec__head {
    flex-direction: column;
  }
}
</style>
