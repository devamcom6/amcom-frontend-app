import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Plugin } from 'vite'
import { DISALLOWED_PATHS, LEGAL_PAGES, SEO_PAGES, renderSeoHead, type SeoPage } from '../src/constants/seo'

/**
 * Build-time SEO for the SPA:
 *  1. Injects the SEO <head> block (title, description, canonical, Open Graph, Twitter, JSON-LD) into index.html.
 *  2. Writes dist/<path>/index.html for every public page with that page's own head, so crawlers that
 *     don't run JavaScript (WhatsApp, LinkedIn, Facebook, X, Slack previews) see correct metadata.
 *     nginx's `try_files $uri $uri/ /index.html` serves these automatically; the Vue app then boots as usual.
 *  3. Writes robots.txt and sitemap.xml (static pages + live estates/properties from the API, best effort).
 */
interface Options {
  siteUrl: string
  apiBaseUrl: string
  /** Fetch estates/properties for the sitemap (off for mock builds). */
  includeDynamic: boolean
}

const START = '<!-- seo:start -->'
const END = '<!-- seo:end -->'
const BLOCK = new RegExp(`${START}[\\s\\S]*?${END}`)

const block = (siteUrl: string, page: Pick<SeoPage, 'path' | 'title' | 'description'>) =>
  `${START}\n    ${renderSeoHead(siteUrl, page)}\n    ${END}`

interface ListPage<T> {
  data?: T[]
  meta?: { last_page?: number }
}

/** Fetch every page of a public list endpoint; returns [] on any failure so the build never breaks. */
async function fetchAll<T>(url: string, maxPages = 20): Promise<T[]> {
  const out: T[] = []
  try {
    for (let page = 1; page <= maxPages; page++) {
      const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}per_page=100&page=${page}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = (await res.json()) as ListPage<T>
      out.push(...(body.data ?? []))
      if (!body.meta?.last_page || page >= body.meta.last_page) break
    }
  } catch (e) {
    console.warn(`[seo] sitemap: skipped ${url} (${(e as Error).message})`)
  }
  return out
}

const xmlEscape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function seoPlugin({ siteUrl, apiBaseUrl, includeDynamic }: Options): Plugin {
  const site = siteUrl.replace(/\/+$/, '')
  const home = SEO_PAGES.find((p) => p.path === '/') ?? SEO_PAGES[0]!
  let outDir = 'dist'
  let isBuild = false

  return {
    name: 'amcom:seo',
    configResolved(config) {
      outDir = config.build.outDir
      isBuild = config.command === 'build'
    },
    transformIndexHtml(html) {
      return html.replace(BLOCK, block(site, home))
    },
    async closeBundle() {
      if (!isBuild) return // also called when the dev server shuts down
      const indexPath = join(outDir, 'index.html')
      let template: string
      try {
        template = readFileSync(indexPath, 'utf8')
      } catch {
        return // not a client build
      }

      // 2. Prerendered heads for public pages.
      for (const page of [...SEO_PAGES, ...LEGAL_PAGES]) {
        if (page.path === '/') continue
        const file = join(outDir, page.path.replace(/^\//, ''), 'index.html')
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, template.replace(BLOCK, block(site, page)))
      }

      // 3a. robots.txt
      const robots = [
        'User-agent: *',
        'Allow: /',
        ...DISALLOWED_PATHS.map((p) => `Disallow: ${p}`),
        '',
        `Sitemap: ${site}/sitemap.xml`,
        '',
      ].join('\n')
      writeFileSync(join(outDir, 'robots.txt'), robots)

      // 3b. sitemap.xml
      const today = new Date().toISOString().slice(0, 10)
      const entries: { loc: string; changefreq?: string; priority?: number }[] = [...SEO_PAGES, ...LEGAL_PAGES].map((p) => ({
        loc: `${site}${p.path === '/' ? '/' : p.path}`,
        changefreq: p.changefreq,
        priority: p.priority,
      }))
      if (includeDynamic && /^https?:\/\//.test(apiBaseUrl)) {
        const api = apiBaseUrl.replace(/\/+$/, '')
        const [estates, properties] = await Promise.all([
          fetchAll<{ slug: string }>(`${api}/estates`),
          fetchAll<{ slug: string }>(`${api}/properties`),
        ])
        entries.push(
          ...estates.map((e) => ({ loc: `${site}/buyback/estates/${encodeURIComponent(e.slug)}`, changefreq: 'weekly', priority: 0.7 })),
          ...properties.map((p) => ({ loc: `${site}/properties/${encodeURIComponent(p.slug)}`, changefreq: 'weekly', priority: 0.6 })),
        )
        console.log(`[seo] sitemap: ${estates.length} estates, ${properties.length} properties`)
      }
      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...entries.map(
          (e) =>
            `  <url><loc>${xmlEscape(e.loc)}</loc><lastmod>${today}</lastmod>${e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : ''}${e.priority !== undefined ? `<priority>${e.priority.toFixed(1)}</priority>` : ''}</url>`,
        ),
        '</urlset>',
        '',
      ].join('\n')
      writeFileSync(join(outDir, 'sitemap.xml'), xml)
      console.log(`[seo] wrote ${SEO_PAGES.length + LEGAL_PAGES.length - 1} page heads, robots.txt, sitemap.xml (${entries.length} URLs)`)
    },
  }
}
