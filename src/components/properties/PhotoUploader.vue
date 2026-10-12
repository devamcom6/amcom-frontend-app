<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppSpinner from '@/components/base/AppSpinner.vue'
import type { Media } from '@/types'
import { IMAGE_UPLOAD_RULES, validateFile } from '@/utils/files'

/**
 * Drag-and-drop photo uploader. Files are validated client-side (type/size/count),
 * then streamed one by one to Laravel, which uploads to Cloudinary and returns Media.
 * No Cloudinary credentials or unsigned presets exist in the frontend.
 */
const props = withDefaults(
  defineProps<{
    photos: Media[]
    max?: number
    upload: (file: File, onProgress: (p: number) => void) => Promise<Media>
    remove: (media: Media) => Promise<void>
  }>(),
  { max: 10 },
)
const emit = defineEmits<{ error: [string]; change: [Media[]] }>()

interface Pending {
  key: string
  name: string
  preview: string
  progress: number
}

const pending = ref<Pending[]>([])
const removing = ref<number | null>(null)
const dragging = ref(false)
const input = ref<HTMLInputElement | null>(null)

const total = computed(() => props.photos.length + pending.value.length)
const slots = computed(() => Math.max(0, props.max - total.value))

async function handleFiles(list: FileList | File[]) {
  const files = Array.from(list)
  const room = props.max - total.value
  if (files.length > room) emit('error', `You can upload ${room} more photo${room === 1 ? '' : 's'} (maximum ${props.max}).`)
  for (const file of files.slice(0, Math.max(0, room))) {
    const invalid = validateFile(file, IMAGE_UPLOAD_RULES)
    if (invalid) {
      emit('error', invalid)
      continue
    }
    const item: Pending = { key: `${file.name}-${file.lastModified}-${Math.random()}`, name: file.name, preview: URL.createObjectURL(file), progress: 0 }
    pending.value = [...pending.value, item]
    try {
      const media = await props.upload(file, (p) => {
        item.progress = p
        pending.value = [...pending.value]
      })
      emit('change', [...props.photos, media])
    } catch {
      emit('error', `${file.name} could not be uploaded. Please try again.`)
    } finally {
      pending.value = pending.value.filter((p) => p.key !== item.key)
      URL.revokeObjectURL(item.preview)
    }
  }
}

function onDrop(e: DragEvent) {
  dragging.value = false
  if (e.dataTransfer?.files.length) void handleFiles(e.dataTransfer.files)
}

function onPick(e: Event) {
  const el = e.target as HTMLInputElement
  if (el.files?.length) void handleFiles(el.files)
  el.value = ''
}

async function removePhoto(media: Media) {
  removing.value = media.id
  try {
    await props.remove(media)
    emit('change', props.photos.filter((p) => p.id !== media.id))
  } catch {
    emit('error', 'That photo could not be removed. Please try again.')
  } finally {
    removing.value = null
  }
}

const browse = () => input.value?.click()
</script>

<template>
  <div class="uploader">
    <p class="uploader__count" aria-live="polite">Uploaded Photos ({{ photos.length }}/{{ max }})</p>
    <div
      class="uploader__drop"
      :class="{ 'is-dragging': dragging, 'is-full': !slots }"
      role="button"
      tabindex="0"
      :aria-disabled="!slots"
      aria-label="Upload photos. Drag photos here or press Enter to browse."
      @click="slots && browse()"
      @keydown.enter.prevent="slots && browse()"
      @keydown.space.prevent="slots && browse()"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <AppIcon name="camera" :size="40" :stroke-width="1.25" class="uploader__icon" />
      <p class="uploader__title">{{ slots ? 'Drag photos here or click to browse' : 'Maximum number of photos reached' }}</p>
      <p class="uploader__hint">Upload up to {{ max }} photos. JPG, PNG. Max 5MB each.</p>
      <input ref="input" type="file" accept="image/jpeg,image/png,image/webp" multiple class="sr-only" tabindex="-1" @change="onPick" />
    </div>

    <ul class="uploader__grid" role="list">
      <li v-for="(photo, i) in photos" :key="photo.id" class="uploader__tile uploader__tile--filled">
        <img :src="photo.thumbnail_url" :alt="photo.alt_text ?? `Photo ${i + 1}`" loading="lazy" decoding="async" />
        <span v-if="i === 0" class="uploader__cover">Cover</span>
        <button type="button" class="uploader__remove" :aria-label="`Remove photo ${i + 1}`" :disabled="removing === photo.id" @click="removePhoto(photo)">
          <AppSpinner v-if="removing === photo.id" :size="14" />
          <AppIcon v-else name="close" :size="16" />
        </button>
      </li>
      <li v-for="p in pending" :key="p.key" class="uploader__tile uploader__tile--filled is-uploading">
        <img :src="p.preview" :alt="`Uploading ${p.name}`" />
        <span class="uploader__progress" role="progressbar" :aria-valuenow="p.progress" aria-valuemin="0" aria-valuemax="100" :aria-label="`Uploading ${p.name}`">
          <span :style="{ width: `${p.progress}%` }" />
        </span>
      </li>
      <li v-for="i in slots" :key="`empty-${i}`" class="uploader__tile">
        <button type="button" class="uploader__add" :aria-label="`Add photo`" @click="browse">+</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.uploader {
  display: grid;
  gap: 12px;
}

.uploader__count {
  justify-self: end;
  font-size: var(--text-sm);
  letter-spacing: 0.01em;
  color: var(--color-ink);
}

.uploader__drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 198px;
  padding: 24px;
  border: 1.5px dashed #cfcfcf;
  border-radius: var(--radius-xs);
  background: #f9f9f8;
  text-align: center;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease),
    background-color var(--duration-fast) var(--ease);
}

.uploader__drop:hover,
.uploader__drop.is-dragging {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.uploader__drop:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.uploader__drop.is-full {
  cursor: not-allowed;
  opacity: 0.7;
}

.uploader__icon {
  color: var(--color-muted);
  margin-bottom: 8px;
}

.uploader__title {
  font-weight: 500;
  color: var(--color-ink);
}

.uploader__hint {
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.uploader__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.uploader__tile {
  position: relative;
  aspect-ratio: 125 / 75;
  border: 1px solid #d6d6d6;
  border-radius: var(--radius-xs);
  background: #f9f9f8;
  overflow: hidden;
}

.uploader__tile--filled img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.is-uploading img {
  opacity: 0.6;
}

.uploader__add {
  width: 100%;
  height: 100%;
  font-size: 1.25rem;
  color: var(--color-muted);
}

.uploader__add:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.uploader__remove {
  position: absolute;
  top: 6px;
  right: 6px;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(17, 20, 24, 0.65);
  color: #fff;
}

.uploader__cover {
  position: absolute;
  left: 6px;
  bottom: 6px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: rgba(17, 20, 24, 0.65);
  color: #fff;
  font-size: 11px;
}

.uploader__progress {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 8px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.6);
  overflow: hidden;
}

.uploader__progress span {
  display: block;
  height: 100%;
  background: var(--color-primary);
  transition: width var(--duration) var(--ease);
}

@media (max-width: 767px) {
  .uploader__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .uploader__drop {
    min-height: 160px;
  }
}
</style>
