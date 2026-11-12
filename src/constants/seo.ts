/**
 * Single source of truth for search & social metadata.
 *
 * Imported by the app (router → applySeo) AND by vite.config.ts at build time
 * (static per-page HTML for link-preview crawlers, sitemap.xml, robots.txt),
 * so it must stay dependency-free: no `@/` imports, no `import.meta.env`.
 */

export const SITE = {
  name: 'Amcom',
  legalName: 'Amcom Asset Management Company',
  /** Suffix appended to page titles: "Buyback | Amcom". */
  titleSuffix: 'Amcom',
  defaultTitle: 'Amcom | Real Estate Investment, Land Buyback & Property Management in Nigeria',
  defaultDescription:
    'Invest in vetted Nigerian real estate with Amcom: contract-backed land buyback, fixed-return capital investment from ₦500,000, and end-to-end property management.',
  /** Relative to the site URL; 1200×630. */
  ogImage: '/og-image.jpg',
  ogImageAlt: 'Amcom: Invest. Earn. Own Property.',
  locale: 'en_NG',
  themeColor: '#2e6f62',
  email: 'admin@amcomglobal.com',
  parentOrganization: 'Houvincity Group',
} as const

export interface SeoPage {
  path: string
  title: string
  description: string
  /** sitemap hints */
  changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  priority?: number
}

/** Public, indexable pages. Each gets its own prerendered HTML head and a sitemap entry. */
export const SEO_PAGES: SeoPage[] = [
  {
    path: '/',
    title: SITE.defaultTitle,
    description: SITE.defaultDescription,
    changefreq: 'weekly',
    priority: 1,
  },
  {
    path: '/buyback',
    title: 'Land Buyback Investment: Earn Up to 200% Returns',
    description:
      'Buy plots in vetted estates and earn contract-backed returns with guaranteed buyback terms. Flexible 12, 24 or 36-month holding periods, fully documented.',
    changefreq: 'weekly',
    priority: 0.9,
  },
  {
    path: '/capital-investment',
    title: 'Capital Investment: 15–30% Real Estate-Backed Returns',
    description:
      'Invest from ₦500,000 and earn 15%–30% annual returns on real estate-backed funds. Capital secured by titled property, with clear tenures and maturity dates.',
    changefreq: 'weekly',
    priority: 0.9,
  },
  {
    path: '/property-management',
    title: 'Property Management: Buy, Rent, Sell or Lease',
    description:
      'List, rent, sell or lease property in Nigeria with Amcom. Verified listings, professional management and a secure, stress-free process from start to finish.',
    changefreq: 'monthly',
    priority: 0.8,
  },
  {
    path: '/properties',
    title: 'Properties for Sale, Rent and Lease in Nigeria',
    description:
      'Browse verified houses, apartments, land and commercial properties for sale, rent and lease across Lagos, Port Harcourt, Abuja and more.',
    changefreq: 'daily',
    priority: 0.8,
  },
  {
    path: '/about',
    title: 'About Amcom Asset Management',
    description:
      'Amcom is a Nigerian real estate asset management company, part of Houvincity Group, helping individuals build wealth through secure, documented property investments.',
    changefreq: 'yearly',
    priority: 0.6,
  },
  {
    path: '/contact',
    title: 'Contact Amcom',
    description: 'Talk to the Amcom team about land buyback, capital investment or property management. Email admin@amcomglobal.com or send us a message.',
    changefreq: 'yearly',
    priority: 0.5,
  },
]

/** CMS legal pages (`/legal/:slug`). */
export const LEGAL_PAGES: SeoPage[] = [
  { path: '/legal/privacy-policy', title: 'Privacy Policy', description: 'How Amcom collects, uses and protects your personal information.', changefreq: 'yearly', priority: 0.3 },
  { path: '/legal/terms-of-service', title: 'Terms of Service', description: 'The terms that govern your use of Amcom and its investment and property services.', changefreq: 'yearly', priority: 0.3 },
  { path: '/legal/cookie-policy', title: 'Cookie Policy', description: 'How Amcom uses cookies and similar technologies on amcomglobal.com.', changefreq: 'yearly', priority: 0.2 },
]

/** Paths search engines should not crawl (also marked noindex at runtime). */
export const DISALLOWED_PATHS = [
  '/dashboard',
  '/admin',
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',
  '/account-created',
  '/onboarding',
  '/auth/',
  '/list-property',
  '/submitted',
  '/payments/',
  '/capital-investment/invest',
  '/buyback/estates/*/checkout',
  '/dev/',
]

export const fullTitle = (title: string) => (title.includes(SITE.titleSuffix) ? title : `${title} | ${SITE.titleSuffix}`)

/** Organisation + website structured data (JSON-LD), shared by every page. */
export function siteJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: SITE.name,
        legalName: SITE.legalName,
        url: `${siteUrl}/`,
        email: SITE.email,
        description: SITE.defaultDescription,
        areaServed: { '@type': 'Country', name: 'Nigeria' },
        parentOrganization: { '@type': 'Organization', name: SITE.parentOrganization },
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: SITE.name,
        inLanguage: 'en-NG',
        publisher: { '@id': `${siteUrl}/#organization` },
      },
    ],
  }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** The <head> SEO block, rendered at build time into every prerendered page. Runtime updates the same tags. */
export function renderSeoHead(siteUrl: string, page: Pick<SeoPage, 'path' | 'title' | 'description'>): string {
  const url = `${siteUrl}${page.path === '/' ? '/' : page.path}`
  const title = esc(fullTitle(page.title))
  const description = esc(page.description)
  const image = `${siteUrl}${SITE.ogImage}`
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(SITE.name)}" />`,
    `<meta property="og:locale" content="${SITE.locale}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(SITE.ogImageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<script type="application/ld+json">${JSON.stringify(siteJsonLd(siteUrl)).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ')
}
