import { config } from '@/config/env'
import { SITE, fullTitle } from '@/constants/seo'

export interface SeoInput {
  title?: string
  description?: string
  /** Path for the canonical/og:url (query and hash are dropped). Defaults to the current path. */
  path?: string
  /** Absolute URL or site-relative path; defaults to the site's Open Graph image. */
  image?: string | null
  imageAlt?: string
  noindex?: boolean
  type?: 'website' | 'article'
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

const absolute = (url: string) => (/^https?:\/\//i.test(url) ? url : `${config.appUrl}${url.startsWith('/') ? '' : '/'}${url}`)
const clip = (text: string, max = 160) => {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length <= max ? t : `${t.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}

/**
 * Updates title, description, canonical, robots, Open Graph and Twitter tags in place.
 * The same tags are prerendered at build time (constants/seo.ts → renderSeoHead), so
 * crawlers that don't run JavaScript still see correct values for the public pages.
 */
export function applySeo(input: SeoInput = {}) {
  const title = input.title ? fullTitle(input.title) : SITE.defaultTitle
  const description = clip(input.description || SITE.defaultDescription)
  const path = (input.path ?? window.location.pathname).split(/[?#]/)[0] || '/'
  const url = absolute(path === '/' ? '/' : path.replace(/\/+$/, ''))
  const image = absolute(input.image || SITE.ogImage)

  document.title = title
  setMeta('name', 'description', description)
  setMeta('name', 'robots', input.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')
  setCanonical(url)

  setMeta('property', 'og:type', input.type ?? 'website')
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:url', url)
  setMeta('property', 'og:image', image)
  setMeta('property', 'og:image:alt', input.imageAlt || SITE.ogImageAlt)
  // Width/height only describe the default image; drop them for page-specific images.
  const isDefault = !input.image
  for (const key of ['og:image:width', 'og:image:height'] as const) {
    const el = document.head.querySelector(`meta[property="${key}"]`)
    if (isDefault) setMeta('property', key, key.endsWith('width') ? '1200' : '630')
    else el?.remove()
  }

  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', description)
  setMeta('name', 'twitter:image', image)
}

/** Page-specific structured data (e.g. a listing). Pass null to remove it. */
export function setPageJsonLd(data: Record<string, unknown> | null) {
  const id = 'page-jsonld'
  document.getElementById(id)?.remove()
  if (!data) return
  const el = document.createElement('script')
  el.type = 'application/ld+json'
  el.id = id
  el.textContent = JSON.stringify({ '@context': 'https://schema.org', ...data })
  document.head.appendChild(el)
}
