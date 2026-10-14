<script setup lang="ts">
import AppSelect from '@/components/base/AppSelect.vue'
import { ref } from 'vue'
import AdminToolbar from '@/components/admin/AdminToolbar.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppEmptyState from '@/components/base/AppEmptyState.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppImage from '@/components/base/AppImage.vue'
import AppPagination from '@/components/base/AppPagination.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import { useResourceList } from '@/composables/useResourceList'
import { adminService, mediaService } from '@/services/api'
import { useUiStore } from '@/stores/ui'
import type { Media } from '@/types'
import { IMAGE_UPLOAD_RULES, validateFile } from '@/utils/files'
import { formatFileSize, humanize } from '@/utils/format'

/**
 * Media library. Uploads go to Laravel (multipart) which stores them in Cloudinary and returns
 * the Media record with optimised URLs. No Cloudinary credentials or upload presets live here.
 */
const ui = useUiStore()
const list = useResourceList<Media, { collection: string }>({ fetcher: (q) => adminService.media(q), perPage: 12, filters: { collection: '' } })

const input = ref<HTMLInputElement | null>(null)
const uploading = ref(0)

async function onFiles(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  ;(e.target as HTMLInputElement).value = ''
  for (const file of files) {
    const invalid = validateFile(file, IMAGE_UPLOAD_RULES)
    if (invalid) {
      ui.error(invalid)
      continue
    }
    uploading.value++
    try {
      await mediaService.upload(file, 'content', file.name.replace(/\.[^.]+$/, ''))
      ui.success(`${file.name} uploaded`)
    } catch (err) {
      ui.apiError(err)
    } finally {
      uploading.value--
    }
  }
  await list.refresh()
}

async function copy(url: string) {
  try {
    await navigator.clipboard.writeText(new URL(url, window.location.origin).toString())
    ui.success('URL copied')
  } catch {
    ui.error('Could not copy to clipboard')
  }
}
</script>

<template>
  <div>
    <AdminToolbar v-model:search="list.search.value" placeholder="Search media">
      <AppSelect v-model="list.filters.collection" variant="filter" label="Collection" hide-label empty-label="All collections" :options="['estate_gallery', 'property_gallery', 'listing_photo', 'content', 'avatar'].map((v) => ({ value: v, label: humanize(v) }))" />
      <AppButton size="sm" icon-left="upload" :loading="uploading > 0" @click="input?.click()">Upload</AppButton>
      <input ref="input" type="file" multiple accept="image/jpeg,image/png,image/webp" class="sr-only" tabindex="-1" @change="onFiles" />
    </AdminToolbar>

    <AppErrorState v-if="list.error.value" :error="list.error.value" @retry="list.refresh" />
    <div v-else-if="list.loading.value && !list.loaded.value" class="grid"><AppSkeleton v-for="i in 8" :key="i" height="200px" radius="12px" /></div>
    <AppEmptyState v-else-if="!list.items.value.length" icon="image" title="No media yet" description="Upload estate and property imagery to use across the website." />
    <template v-else>
      <ul class="grid" role="list">
        <li v-for="m in list.items.value" :key="m.id" class="item">
          <AppImage :media="m" ratio="4/3" sizes="240px" />
          <div class="item__body">
            <p class="item__alt" :title="m.alt_text ?? ''">{{ m.alt_text || 'No alt text' }}</p>
            <p class="item__meta">{{ m.width }}×{{ m.height }} · {{ m.format.toUpperCase() }} · {{ formatFileSize(m.size_bytes) }}</p>
            <button type="button" class="item__copy" @click="copy(m.url)">Copy URL</button>
          </div>
        </li>
      </ul>
      <AppPagination v-model:page="list.page.value" :meta="list.meta.value" label="files" />
    </template>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.item {
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  overflow: hidden;
}

.item__body {
  padding: 10px 12px 12px;
}

.item__alt {
  font-size: var(--text-sm);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item__meta {
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.item__copy {
  margin-top: 6px;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-primary);
}
</style>
