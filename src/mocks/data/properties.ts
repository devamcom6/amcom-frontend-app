import type { ListingType, PropertyDetail, PropertyType } from '@/types'
import { mockMedia } from '../media'

interface Seed {
  title: string
  address: string
  city: string
  state: string
  listing_type: ListingType
  property_type: PropertyType
  price: number
  bedrooms: number | null
  bathrooms: number | null
  size_sqm: number
  cover: string
}

const SEEDS: Seed[] = [
  { title: '3 Bed Apartment, Lekki Phase 1', address: '12 Admiralty Way', city: 'Lekki', state: 'Lagos', listing_type: 'sale', property_type: 'apartment', price: 45_000_000, bedrooms: 3, bathrooms: 2, size_sqm: 150, cover: 'property-lounge' },
  { title: '4 Bed Duplex, Lekki Phase 1', address: '24 Fola Osibo Road', city: 'Lekki', state: 'Lagos', listing_type: 'rent', property_type: 'duplex', price: 4_500_000, bedrooms: 4, bathrooms: 4, size_sqm: 280, cover: 'property-villa' },
  { title: 'Open-plan Loft Office, Victoria Island', address: '5 Akin Adesola Street', city: 'Victoria Island', state: 'Lagos', listing_type: 'lease', property_type: 'office', price: 12_000_000, bedrooms: null, bathrooms: 2, size_sqm: 320, cover: 'property-terrace' },
  { title: '5 Bed Mansion, Ikoyi', address: '3 Bourdillon Road', city: 'Ikoyi', state: 'Lagos', listing_type: 'sale', property_type: 'house', price: 650_000_000, bedrooms: 5, bathrooms: 6, size_sqm: 820, cover: 'property-mansion' },
  { title: '2 Bed Serviced Apartment, Ikeja GRA', address: '17 Isaac John Street', city: 'Ikeja', state: 'Lagos', listing_type: 'rent', property_type: 'apartment', price: 6_000_000, bedrooms: 2, bathrooms: 2, size_sqm: 110, cover: 'property-living' },
  { title: 'Luxury Penthouse, Lagos Island', address: '1 Marina Road', city: 'Lagos Island', state: 'Lagos', listing_type: 'sale', property_type: 'apartment', price: 380_000_000, bedrooms: 4, bathrooms: 5, size_sqm: 410, cover: 'property-tower' },
  { title: '3 Bed Terrace, Ajah', address: '8 Abraham Adesanya Estate', city: 'Ajah', state: 'Lagos', listing_type: 'sale', property_type: 'terrace', price: 72_000_000, bedrooms: 3, bathrooms: 3, size_sqm: 190, cover: 'property-apartments' },
  { title: 'Oakwood Residences, Apt 4B', address: '12 Oakwood Drive, Trans-Amadi', city: 'Port Harcourt', state: 'Rivers', listing_type: 'lease', property_type: 'apartment', price: 1_800_000, bedrooms: 2, bathrooms: 2, size_sqm: 120, cover: 'property-building' },
  { title: 'Waterfront Plot, Banana Island', address: 'Plot 22, Banana Island', city: 'Ikoyi', state: 'Lagos', listing_type: 'sale', property_type: 'land', price: 950_000_000, bedrooms: null, bathrooms: null, size_sqm: 1500, cover: 'estate-devilla' },
  { title: 'Warehouse, Trans-Amadi Industrial Layout', address: '44 Trans-Amadi Road', city: 'Port Harcourt', state: 'Rivers', listing_type: 'lease', property_type: 'warehouse', price: 25_000_000, bedrooms: null, bathrooms: 2, size_sqm: 2200, cover: 'estate-greenlush' },
  { title: 'Amara Heights, Unit 3C', address: '9 Amara Close, Trans-Amadi', city: 'Port Harcourt', state: 'Rivers', listing_type: 'rent', property_type: 'apartment', price: 3_000_000, bedrooms: 3, bathrooms: 3, size_sqm: 160, cover: 'property-apartments' },
  { title: '4 Bed Detached Duplex, Maitama', address: '15 Gana Street', city: 'Maitama', state: 'FCT', listing_type: 'sale', property_type: 'duplex', price: 410_000_000, bedrooms: 4, bathrooms: 5, size_sqm: 540, cover: 'property-villa' },
]

const FEATURES = [
  'Contract of sale',
  'Swimming pool',
  '24/7 Security',
  'Gated compound',
  'Parking space',
  'Fitted kitchen',
  'CCTV surveillance',
  'Elevator access',
  'Balcony',
  'Gym',
  'Serviced',
  'Water treatment',
  'Smart home',
  'Power backup',
  'Borehole',
  'Staff quarters',
]

const DESCRIPTION =
  'A bright, well-finished home on a serene, quiet street, ten minutes from the business district and close to schools, shopping and the expressway. Living spaces open onto a generous terrace with city views, and the fitted kitchen comes fully equipped. The building has 24-hour water supply, backup power, on-site security and a cleaning service. Parking is available for two cars. The property has been physically inspected and verified by the Amcom team, with title documents reviewed and a clean search report on file.'

const COORDS: Record<string, [number, number]> = {
  Lagos: [6.4474, 3.4723],
  Rivers: [4.8156, 7.0498],
  FCT: [9.0765, 7.3986],
}

export function seedProperties(): PropertyDetail[] {
  return SEEDS.map((s, i) => {
    const slug = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const [lat, lng] = COORDS[s.state] ?? [6.5, 3.4]
    return {
      id: i + 1,
      slug,
      title: s.title,
      address: `${s.address}, ${s.city}, ${s.state}`,
      city: s.city,
      state: s.state,
      listing_type: s.listing_type,
      property_type: s.property_type,
      price: s.price,
      price_period: s.listing_type === 'sale' ? null : 'year',
      bedrooms: s.bedrooms,
      bathrooms: s.bathrooms,
      size_sqm: s.size_sqm,
      cover_image: mockMedia(s.cover, s.title),
      description: DESCRIPTION,
      features: FEATURES.slice(0, 10 + (i % 6)),
      gallery: [
        mockMedia(s.cover, `${s.title} — exterior`),
        mockMedia('property-lounge', `${s.title} — living area`),
        mockMedia('property-terrace', `${s.title} — terrace`),
        mockMedia('property-bedroom', `${s.title} — bedroom`),
        mockMedia('property-kitchen', `${s.title} — kitchen`),
        mockMedia('property-bathroom', `${s.title} — bathroom`),
      ],
      latitude: lat + (i % 5) * 0.01,
      longitude: lng + (i % 3) * 0.01,
      location_label: `${s.city}, ${s.state}`,
      condition: 'newly_built',
      furnishing: i % 2 ? 'furnished' : 'semi_furnished',
    }
  })
}
