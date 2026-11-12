import { config } from '@/config/env'

export const COMPANY = {
  name: 'Amcom',
  tagline: 'Your trusted real estate partner',
  description:
    'Amcom is your trusted partner in real estate. We connect buyers, sellers, and renters with exceptional properties through innovative technology and personalized service.',
  address: '24 Marina Road, Victoria Island, Lagos, Nigeria.',
  phone: '+234-801-234-5678',
  email: 'admin@amcomglobal.com',
  supportEmail: config.supportEmail,
  supportPhone: config.supportPhone,
  parentGroup: 'Houvincity Group',
}

/** Fallbacks only: the live URLs come from GET /lookups (legal.*) so the backend can publish new versions. */
export const LEGAL_FALLBACKS = {
  buyerTermsUrl: 'https://res.cloudinary.com/prl3lpkk/raw/upload/v1794506071/TERMS_AND_CONDITIONS_FOR_BUYERS_UNDER_PROPERTY_LISITNG.docx',
  buyerTermsPdfUrl: 'https://res.cloudinary.com/prl3lpkk/image/upload/v1794512956/TERMS_AND_CONDITIONS_FOR_BUYERS_UNDER_PROPERTY_LISITNG.pdf',
}

/**
 * Cloudinary URL that downloads instead of opening (`fl_attachment`), with a friendly file name.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function cloudinaryDownloadUrl(url: string, fileName: string): string {
  return url.replace(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|raw|video)\/upload\/)/, `$1fl_attachment:${encodeURIComponent(fileName)}/`)
}

export const SOCIAL_LINKS = [
  { label: 'LinkedIn', icon: 'linkedin', href: 'https://www.linkedin.com' },
  { label: 'Facebook', icon: 'facebook', href: 'https://www.facebook.com' },
  { label: 'Instagram', icon: 'instagram', href: 'https://www.instagram.com' },
  { label: 'Twitter', icon: 'twitter', href: 'https://twitter.com' },
] as const
