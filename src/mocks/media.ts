import type { Media } from '@/types'
import manifest from './media-manifest.json'

type ManifestEntry = {
  width: number
  height: number
  dominant_color: string
  variants: Record<string, string>
  thumbnail: string
}

const entries = manifest as Record<string, ManifestEntry>
let seq = 1000

/**
 * Builds a Media object identical in shape to what Laravel returns after a Cloudinary upload.
 * In production `url`/`variants` point at res.cloudinary.com with f_auto,q_auto,w_<n> transformations.
 */
export function mockMedia(name: keyof typeof manifest | string, altText: string): Media {
  const entry = entries[name]
  if (!entry) throw new Error(`Unknown mock media: ${name}`)
  const widths = Object.keys(entry.variants).map(Number).sort((a, b) => a - b)
  const largest = widths[widths.length - 1]
  return {
    id: ++seq,
    url: entry.variants[String(largest)] ?? entry.thumbnail,
    thumbnail_url: entry.thumbnail,
    width: entry.width,
    height: entry.height,
    format: 'webp',
    alt_text: altText,
    variants: entry.variants,
    dominant_color: entry.dominant_color,
    mime_type: 'image/webp',
  }
}

/** Media for a freshly uploaded local file (mock only): uses an object URL. */
export function mediaFromFile(file: File, collection: Media['collection']): Promise<Media> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () =>
      resolve({
        id: ++seq,
        url,
        thumbnail_url: url,
        width: img.naturalWidth,
        height: img.naturalHeight,
        format: file.type.split('/')[1] ?? 'jpeg',
        alt_text: file.name.replace(/\.[^.]+$/, ''),
        size_bytes: file.size,
        mime_type: file.type,
        collection,
        created_at: new Date().toISOString(),
      })
    img.onerror = () =>
      resolve({
        id: ++seq,
        url,
        thumbnail_url: url,
        width: 0,
        height: 0,
        format: 'unknown',
        alt_text: file.name,
        collection,
      })
    img.src = url
  })
}
