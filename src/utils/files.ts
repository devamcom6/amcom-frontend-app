export interface FileRules {
  accept: string[]
  maxBytes: number
}

export const IMAGE_UPLOAD_RULES: FileRules = {
  accept: ['image/jpeg', 'image/png', 'image/webp'],
  maxBytes: 5 * 1024 * 1024,
}

export const AVATAR_UPLOAD_RULES: FileRules = {
  accept: ['image/jpeg', 'image/png', 'image/webp'],
  maxBytes: 2 * 1024 * 1024,
}

/** Returns an error message, or null when the file passes basic client-side checks. */
export function validateFile(file: File, rules: FileRules): string | null {
  if (!rules.accept.includes(file.type)) {
    const exts = rules.accept.map((t) => t.split('/')[1]?.toUpperCase()).join(', ')
    return `${file.name}: unsupported file type. Use ${exts}.`
  }
  if (file.size > rules.maxBytes) {
    return `${file.name}: file is larger than ${Math.round(rules.maxBytes / 1024 / 1024)}MB.`
  }
  return null
}

/** Trigger a browser download for a URL (signed URL from Laravel) or Blob. */
export function triggerDownload(source: string | Blob, filename: string): void {
  const href = typeof source === 'string' ? source : URL.createObjectURL(source)
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  if (typeof source !== 'string') setTimeout(() => URL.revokeObjectURL(href), 1000)
}
