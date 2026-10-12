import { ref } from 'vue'
import { mediaService } from '@/services/api'
import { useUiStore } from '@/stores/ui'
import type { DocumentFile } from '@/types'
import { triggerDownload } from '@/utils/files'

/** Downloads private documents via short-lived signed URLs issued by Laravel. */
export function useDocumentDownload() {
  const ui = useUiStore()
  const downloadingId = ref<number | null>(null)

  async function download(doc: Pick<DocumentFile, 'id' | 'name' | 'status'>) {
    if (doc.status !== 'available' && doc.status !== 'pending_review') {
      ui.info('This document is not available yet.')
      return
    }
    downloadingId.value = doc.id
    try {
      const signed = await mediaService.documentDownload(doc.id)
      triggerDownload(signed.url, signed.filename)
    } catch (e) {
      ui.apiError(e, "We couldn't download this document.")
    } finally {
      downloadingId.value = null
    }
  }

  return { download, downloadingId }
}
