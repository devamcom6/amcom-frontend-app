import { del, get, patch, upload } from '@/services/http/client'
import type { Media, MediaCollection, SignedDownload } from '@/types'

/** /api/v1/media/*, /api/v1/documents/* — BACKEND_API_CONTRACT.md §14 */
export const mediaService = {
  upload: (file: File, collection: MediaCollection, altText?: string, onProgress?: (p: number) => void) => {
    const form = new FormData()
    form.append('file', file)
    form.append('collection', collection)
    if (altText) form.append('alt_text', altText)
    return upload<Media>('/media', form, onProgress)
  },
  updateAlt: (id: number, altText: string) => patch<Media>(`/media/${id}`, { alt_text: altText }),
  remove: (id: number) => del(`/media/${id}`),
  /** Documents are private: Laravel returns a short-lived signed URL. */
  documentDownload: (documentId: number) => get<SignedDownload>(`/documents/${documentId}/download`),
}
