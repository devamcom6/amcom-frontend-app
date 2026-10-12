import type {
  FurnishingStatus,
  IdType,
  ListingType,
  Option,
  PropertyCondition,
  PropertyType,
} from '@/types'

export const LISTING_TYPE_OPTIONS: Option<ListingType>[] = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
  { value: 'lease', label: 'For Lease' },
]

export const PROPERTY_TYPE_OPTIONS: Option<PropertyType>[] = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'house', label: 'House' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'terrace', label: 'Terrace' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'other', label: 'Other' },
]

export const CONDITION_OPTIONS: Option<PropertyCondition>[] = [
  { value: 'newly_built', label: 'Newly Built' },
  { value: 'fairly_used', label: 'Fairly Used' },
  { value: 'renovated', label: 'Renovated' },
  { value: 'under_construction', label: 'Under Construction' },
]

export const FURNISHING_OPTIONS: Option<FurnishingStatus>[] = [
  { value: 'furnished', label: 'Furnished' },
  { value: 'semi_furnished', label: 'Semi-Furnished' },
  { value: 'unfurnished', label: 'Unfurnished' },
]

export const AMENITY_OPTIONS: Option[] = [
  { value: 'parking', label: 'Parking' },
  { value: 'security', label: 'Security' },
  { value: 'generator', label: 'Generator' },
  { value: 'borehole', label: 'Borehole' },
  { value: 'swimming_pool', label: 'Swimming Pool' },
  { value: 'gym', label: 'Gym' },
  { value: 'cctv', label: 'CCTV' },
  { value: 'fence_gate', label: 'Fence/Gate' },
  { value: 'serviced', label: 'Serviced' },
]

export const ID_TYPE_OPTIONS: Option<IdType>[] = [
  { value: 'nin', label: 'National Identification Number (NIN)' },
  { value: 'bvn', label: 'Bank Verification Number (BVN)' },
  { value: 'drivers_license', label: "Driver's Licence" },
  { value: 'international_passport', label: 'International Passport' },
  { value: 'voters_card', label: "Voter's Card" },
]

export const RELATIONSHIP_OPTIONS: Option[] = [
  'Spouse',
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Son',
  'Daughter',
  'Relative',
  'Friend',
  'Other',
].map((r) => ({ value: r, label: r }))

export const GENDER_OPTIONS: Option[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const
