import type { Estate, Plot, PlotStatus } from '@/types'
import { mockMedia } from '../media'

const TENURES = [
  { months: 12, roi_percent: 18 },
  { months: 18, roi_percent: 28 },
  { months: 24, roi_percent: 42 },
  { months: 36, roi_percent: 65 },
]

const gallery = (name: string) => [
  mockMedia('estate-greenlush-aerial', `Aerial view of ${name}`),
  mockMedia('property-living', `Show home living room at ${name}`),
  mockMedia('property-bedroom', `Show home bedroom at ${name}`),
  mockMedia('property-kitchen', `Show home kitchen at ${name}`),
  mockMedia('property-bathroom', `Show home bathroom at ${name}`),
  mockMedia('property-building', `Residential block at ${name}`),
]

export function seedEstates(): Estate[] {
  return [
    {
      id: 1,
      slug: 'green-lush-estate',
      name: 'Green Lush Estate',
      location: { address: 'Abara Etche', city: 'Etche', state: 'Rivers State', latitude: 4.9917, longitude: 7.0544 },
      size_sqm: 465,
      tenure_min_months: 12,
      tenure_max_months: 36,
      roi_min_percent: 18,
      roi_max_percent: 65,
      price_from: 2_000_000,
      available_plots: 16,
      cover_image: mockMedia('estate-greenlush', 'Green Lush Estate waterfront homes'),
      description:
        'Green Lush Estate is a master-planned residential enclave engineered for absolute privacy, structural longevity, and exceptional spatial design. Positioned strategic miles outside the congested urban core—yet positioned exactly minutes from Stella Maris University and the UST Extension corridor—the estate offers an uncompromised environment tailored for multi-generational growth, wellness, and calm living.',
      gallery: gallery('Green Lush Estate'),
      tenures: TENURES,
      checkout_mode: 'direct',
      max_plots_per_order: 5,
    },
    {
      id: 2,
      slug: 'riverside-gardens',
      name: 'Riverside Gardens',
      location: { address: 'Lekki Phase 1', city: 'Lekki', state: 'Lagos State', latitude: 6.4474, longitude: 3.4723 },
      size_sqm: 600,
      tenure_min_months: 12,
      tenure_max_months: 36,
      roi_min_percent: 18,
      roi_max_percent: 35,
      price_from: 5_500_000,
      available_plots: 9,
      cover_image: mockMedia('estate-ridgewood', 'Riverside Gardens gated entrance'),
      description:
        'Riverside Gardens is a gated, low-density community in the heart of Lekki with paved roads, central drainage and round-the-clock security. Plots are fully documented with a registered survey and are allocated immediately after payment confirmation.',
      gallery: gallery('Riverside Gardens'),
      tenures: TENURES.map((t) => ({ ...t, roi_percent: Math.min(t.roi_percent, 35) })),
      checkout_mode: 'interest',
      max_plots_per_order: 3,
    },
    {
      id: 3,
      slug: 'estate-de-villa',
      name: 'Estate De Villa',
      location: { address: 'Eleme', city: 'Eleme', state: 'Rivers State', latitude: 4.7917, longitude: 7.1167 },
      size_sqm: 500,
      tenure_min_months: 12,
      tenure_max_months: 36,
      roi_min_percent: 15,
      roi_max_percent: 25,
      price_from: 3_200_000,
      available_plots: 22,
      cover_image: mockMedia('estate-devilla', 'Estate De Villa boulevard and gatehouse'),
      description:
        'Estate De Villa offers serviced plots along a landscaped central boulevard, minutes from the Onne port corridor. Infrastructure includes street lighting, an estate-wide water scheme and a dedicated facility management team.',
      gallery: gallery('Estate De Villa'),
      tenures: TENURES.map((t) => ({ ...t, roi_percent: Math.round(t.roi_percent * 0.4 + 8) })),
      checkout_mode: 'direct',
      max_plots_per_order: 5,
    },
    {
      id: 4,
      slug: 'palm-crest-court',
      name: 'Palm Crest Court',
      location: { address: 'Trans-Amadi', city: 'Port Harcourt', state: 'Rivers State', latitude: 4.8156, longitude: 7.0498 },
      size_sqm: 450,
      tenure_min_months: 12,
      tenure_max_months: 24,
      roi_min_percent: 18,
      roi_max_percent: 42,
      price_from: 4_000_000,
      available_plots: 6,
      cover_image: mockMedia('property-estate-row', 'Palm Crest Court residences at sunset'),
      description:
        'Palm Crest Court is a boutique development of 40 plots within an established neighbourhood, ideal for investors seeking a shorter buyback window.',
      gallery: gallery('Palm Crest Court'),
      tenures: TENURES.slice(0, 3),
      checkout_mode: 'direct',
      max_plots_per_order: 2,
    },
  ]
}

const PATTERN: PlotStatus[] = ['available', 'available', 'sold', 'reserved', 'available', 'available', 'reserved', 'available', 'available', 'available', 'available', 'sold']

export function seedPlots(estate: Estate): Plot[] {
  const prefix = estate.name.charAt(0).toUpperCase()
  const blocks = [73, 74, 75, 76, 77, 78, 82, 83, 84, 85, 86, 87, 91, 92, 93, 94, 95, 96, 97, 98]
  const sizes = [465, 600, 300]
  return blocks.map((n, i) => {
    const size = sizes[i % 3] ?? 465
    return {
      id: estate.id * 1000 + n,
      code: `${prefix}${String(n).padStart(3, '0')}`,
      size_sqm: size,
      price: Math.round((estate.price_from * size) / 465 / 50_000) * 50_000,
      status: PATTERN[i % PATTERN.length] ?? 'available',
    }
  })
}
