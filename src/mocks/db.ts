import type {
  AdminAccount,
  AdminInvestment,
  AdminListing,
  AdminRequest,
  AdminUser,
  AppNotification,
  AuthUser,
  BuybackOrder,
  BuybackPosition,
  CapitalInvestmentOrder,
  CapitalPosition,
  Estate,
  FaqItem,
  HomeContent,
  Listing,
  NotificationPreference,
  PayoutAccount,
  PaymentVerification,
  Plot,
  Profile,
  PropertyDetail,
  PropertyHoldingDetail,
  RoleDefinition,
  SystemSettings,
  Transaction,
} from '@/types'
import { STORAGE_KEYS, readJson, writeJson } from '@/utils/storage'
import { seedEstates, seedPlots } from './data/estates'
import { seedProperties } from './data/properties'
import { DEFAULT_NOTIFICATION_PREFERENCES, SEED_PAYOUT_ACCOUNTS, seedProfiles, seedUsers } from './data/users'
import { listingDocuments, seedBuybackPositions, seedCapitalPositions, seedHoldings } from './data/portfolio'
import { seedFaqs, seedHomeContent, seedPages } from './data/content'
import {
  seedAdminAccounts,
  seedAdminInvestments,
  seedAdminListings,
  seedAdminUsers,
  seedNotifications,
  seedRequests,
  seedRoles,
  seedSettings,
  seedTransactions,
} from './data/admin'
import { mockMedia } from './media'

export interface MockUserRecord extends AuthUser {
  password: string
}

interface PendingPayment {
  reference: string
  userId: number
  callbackUrl: string
  verification: PaymentVerification
}

/** Mutable state that survives reloads (users, sessions, user-created records). */
interface PersistedState {
  version: number
  users: MockUserRecord[]
  profiles: Record<number, Omit<Profile, 'user'>>
  sessions: Record<string, { userId: number; expiresAt: string }>
  emailCodes: Record<string, string>
  resetTokens: Record<string, string>
  listings: Listing[]
  buybackOrders: BuybackOrder[]
  capitalOrders: CapitalInvestmentOrder[]
  capitalPositions: Record<number, CapitalPosition[]>
  buybackPositions: Record<number, BuybackPosition[]>
  payments: Record<string, PendingPayment>
  notifications: Record<number, AppNotification[]>
  preferences: Record<number, NotificationPreference[]>
  payoutAccounts: Record<number, PayoutAccount[]>
  plotStatus: Record<number, Plot['status']>
  roles: RoleDefinition[]
  settings: SystemSettings
  seq: number
}

const VERSION = 3

function seedPersisted(): PersistedState {
  const users = seedUsers()
  return {
    version: VERSION,
    users,
    profiles: seedProfiles(users),
    sessions: {},
    emailCodes: {},
    resetTokens: {},
    listings: [
      {
        id: 1,
        reference: 'LST-2701',
        title: 'Oakwood Residences, Apt 4B',
        listing_type: 'sale',
        property_type: 'apartment',
        state: 'Rivers',
        city: 'Port Harcourt',
        address: '12 Oakwood Drive, Trans-Amadi, Port Harcourt',
        size_sqm: 120,
        bedrooms: 2,
        bathrooms: 2,
        asking_price: 45_000_000,
        condition: 'newly_built',
        furnishing: 'semi_furnished',
        amenities: ['parking', 'security', 'generator'],
        description:
          'A spacious 2-bedroom apartment with modern finishes, open-plan living area, fitted kitchen, and 24/7 security. Located near major landmarks and shopping centers.',
        status: 'pending_verification',
        photos: [
          mockMedia('property-building', 'Oakwood Residences exterior'),
          mockMedia('estate-greenlush', 'Oakwood Residences grounds'),
          mockMedia('property-apartments', 'Oakwood Residences block'),
          mockMedia('property-living', 'Oakwood Residences living room'),
          mockMedia('property-kitchen', 'Oakwood Residences kitchen'),
          mockMedia('property-bedroom', 'Oakwood Residences bedroom'),
          mockMedia('property-bathroom', 'Oakwood Residences bathroom'),
          mockMedia('property-terrace', 'Oakwood Residences terrace'),
        ],
        documents: listingDocuments(),
        listed_at: '2026-10-24',
        rejection_reason: null,
        financial_summary: null,
        activity: null,
        created_at: '2026-10-24T09:00:00Z',
      },
      {
        id: 2,
        reference: 'LST-2655',
        title: 'Amara Heights, Unit 3C',
        listing_type: 'sale',
        property_type: 'apartment',
        state: 'Rivers',
        city: 'Port Harcourt',
        address: '9 Amara Close, Trans-Amadi, Port Harcourt',
        size_sqm: 120,
        bedrooms: 2,
        bathrooms: 2,
        asking_price: 45_000_000,
        condition: 'renovated',
        furnishing: 'furnished',
        amenities: ['parking', 'security', 'cctv'],
        description:
          'A spacious 2-bedroom apartment with modern finishes, open-plan living area, fitted kitchen, and 24/7 security.',
        status: 'published',
        photos: [
          mockMedia('property-apartments', 'Amara Heights exterior'),
          mockMedia('property-lounge', 'Amara Heights lounge'),
          mockMedia('property-kitchen', 'Amara Heights kitchen'),
          mockMedia('property-bedroom', 'Amara Heights bedroom'),
        ],
        documents: listingDocuments(),
        listed_at: '2026-10-24',
        rejection_reason: null,
        financial_summary: {
          expected_sale_price: 45_000_000,
          service_fee_percent: 5,
          service_fee: 2_250_000,
          net_proceeds: 42_750_000,
          payment_status: 'pending_sale',
        },
        activity: { status_label: 'Available', listed_since: '2026-10-24', interested_parties: 12, completed_viewings: 5 },
        created_at: '2026-10-20T09:00:00Z',
      },
    ],
    buybackOrders: [],
    capitalOrders: [],
    capitalPositions: { 1: seedCapitalPositions() },
    buybackPositions: { 1: seedBuybackPositions() },
    payments: {},
    notifications: { 1: seedNotifications(), 3: seedNotifications().slice(3), 4: seedNotifications().slice(3) },
    preferences: {},
    payoutAccounts: structuredClone(SEED_PAYOUT_ACCOUNTS),
    plotStatus: {},
    roles: seedRoles(),
    settings: seedSettings(),
    seq: 5000,
  }
}

function load(): PersistedState {
  const saved = readJson<PersistedState>(STORAGE_KEYS.mockDb)
  if (saved && saved.version === VERSION) return saved
  return seedPersisted()
}

const state = load()

/* Static (non-persisted) reference data. */
const estates: Estate[] = seedEstates()
const plots: Record<number, Plot[]> = Object.fromEntries(estates.map((e) => [e.id, seedPlots(e)]))
const properties: PropertyDetail[] = seedProperties()
const holdings: Record<number, PropertyHoldingDetail[]> = { 1: seedHoldings() }
const adminUsers: AdminUser[] = seedAdminUsers()
const transactions: Transaction[] = seedTransactions(adminUsers)
const adminListings: AdminListing[] = seedAdminListings(adminUsers)
const adminInvestments: AdminInvestment[] = seedAdminInvestments(adminUsers)
const requests: AdminRequest[] = seedRequests()
const adminAccounts: AdminAccount[] = seedAdminAccounts()
const faqs: FaqItem[] = seedFaqs()
const homeContent: HomeContent = seedHomeContent()
const pages = seedPages()

export const db = {
  state,
  estates,
  plots,
  properties,
  holdings,
  adminUsers,
  transactions,
  adminListings,
  adminInvestments,
  requests,
  adminAccounts,
  faqs,
  homeContent,
  pages,
  defaultPreferences: DEFAULT_NOTIFICATION_PREFERENCES,

  nextId(): number {
    state.seq += 1
    return state.seq
  },

  save(): void {
    writeJson(STORAGE_KEYS.mockDb, state)
  },

  reset(): void {
    Object.assign(state, seedPersisted())
    this.save()
  },

  publicUser(user: MockUserRecord): AuthUser {
    const { password: _password, ...rest } = user
    return structuredClone(rest)
  },

  profile(user: MockUserRecord): Profile {
    const p = state.profiles[user.id]
    if (!p) throw new Error('profile missing')
    return { user: this.publicUser(user), ...structuredClone(p) }
  },

  plotsFor(estateId: number): Plot[] {
    return (plots[estateId] ?? []).map((p) => ({ ...p, status: state.plotStatus[p.id] ?? p.status }))
  },
}

// Expose a reset helper in dev tools: `window.__amcomMock.reset()`
;(window as unknown as { __amcomMock: typeof db }).__amcomMock = db
