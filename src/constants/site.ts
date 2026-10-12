import { config } from '@/config/env'

export const COMPANY = {
  name: 'Amcom',
  tagline: 'Your trusted real estate partner',
  description:
    'Amcom is your trusted partner in real estate. We connect buyers, sellers, and renters with exceptional properties through innovative technology and personalized service.',
  address: '24 Marina Road, Victoria Island, Lagos, Nigeria.',
  phone: '+234-801-234-5678',
  email: 'hello@amcom.com',
  supportEmail: config.supportEmail,
  supportPhone: config.supportPhone,
  parentGroup: 'Houvincity Group',
}

export const SOCIAL_LINKS = [
  { label: 'LinkedIn', icon: 'linkedin', href: 'https://www.linkedin.com' },
  { label: 'Facebook', icon: 'facebook', href: 'https://www.facebook.com' },
  { label: 'Instagram', icon: 'instagram', href: 'https://www.instagram.com' },
  { label: 'Twitter', icon: 'twitter', href: 'https://twitter.com' },
] as const
