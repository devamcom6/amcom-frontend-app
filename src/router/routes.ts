import type { RouteRecordRaw } from 'vue-router'
import { SEO_PAGES } from '@/constants/seo'

/** Title + description for a public page, from the shared SEO table (constants/seo.ts). */
const seo = (path: string) => {
  const page = SEO_PAGES.find((p) => p.path === path)
  return page ? { title: page.title, description: page.description } : {}
}

/**
 * Route meta:
 *  - requiresAuth     → must be logged in (visitor is sent to /login?redirect=…)
 *  - guestOnly        → logged-in users are redirected to their home
 *  - roles            → allowed roles (any of)
 *  - permissions      → required permissions (all of)
 *  - allowUnverified  → reachable before the email is verified
 *  - title            → document title
 *  - description      → meta description (SEO)
 *  - noindex          → keep out of search results (auth-only and guest-only routes are noindex automatically)
 */
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    description?: string
    noindex?: boolean
    requiresAuth?: boolean
    guestOnly?: boolean
    roles?: import('@/types').Role[]
    permissions?: import('@/types').Permission[]
    allowUnverified?: boolean
    /** Active top-nav item. */
    nav?: 'buyback' | 'capital' | 'property'
    /** Hide the global footer (checkout flows, dashboards). */
    hideFooter?: boolean
  }
}

const PublicLayout = () => import('@/layouts/PublicLayout.vue')
const AuthLayout = () => import('@/layouts/AuthLayout.vue')
const DashboardLayout = () => import('@/layouts/DashboardLayout.vue')
const AdminLayout = () => import('@/layouts/AdminLayout.vue')

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      { path: '', name: 'home', component: () => import('@/views/public/HomeView.vue'), meta: { ...seo('/') } },
      { path: 'about', name: 'about', component: () => import('@/views/public/AboutView.vue'), meta: { ...seo('/about') } },
      { path: 'contact', name: 'contact', component: () => import('@/views/public/ContactView.vue'), meta: { ...seo('/contact') } },
      { path: 'legal/:slug', name: 'legal', component: () => import('@/views/public/LegalView.vue'), props: true },

      /* Buyback */
      { path: 'buyback', name: 'buyback', component: () => import('@/views/buyback/BuybackView.vue'), meta: { ...seo('/buyback'), nav: 'buyback' } },
      { path: 'buyback/estates/:slug', name: 'estate-detail', component: () => import('@/views/buyback/EstateDetailView.vue'), props: true, meta: { nav: 'buyback' } },
      {
        path: 'buyback/estates/:slug/checkout',
        name: 'buyback-checkout',
        component: () => import('@/views/buyback/BuybackCheckoutView.vue'),
        props: true,
        meta: { title: 'Select plot & tenure', nav: 'buyback', hideFooter: true, noindex: true },
      },

      /* Capital investment */
      { path: 'capital-investment', name: 'capital', component: () => import('@/views/capital/CapitalInvestmentView.vue'), meta: { ...seo('/capital-investment'), nav: 'capital' } },
      {
        path: 'capital-investment/invest',
        name: 'capital-checkout',
        component: () => import('@/views/capital/CapitalCheckoutView.vue'),
        meta: { title: 'Start investing', nav: 'capital', hideFooter: true, noindex: true },
      },

      /* Property management */
      { path: 'property-management', name: 'property-management', component: () => import('@/views/property/PropertyManagementView.vue'), meta: { ...seo('/property-management'), nav: 'property' } },
      { path: 'properties', name: 'properties', component: () => import('@/views/property/PropertyBrowseView.vue'), meta: { ...seo('/properties'), nav: 'property' } },
      { path: 'properties/:slug', name: 'property-detail', component: () => import('@/views/property/PropertyDetailView.vue'), props: true, meta: { nav: 'property' } },
      {
        path: 'list-property',
        name: 'list-property',
        component: () => import('@/views/property/ListPropertyView.vue'),
        meta: { title: 'List your property', nav: 'property', requiresAuth: true, roles: ['user'], hideFooter: true },
      },
      {
        path: 'list-property/:id/edit',
        name: 'listing-edit',
        component: () => import('@/views/property/ListPropertyView.vue'),
        props: (r) => ({ listingId: Number(r.params.id) }),
        meta: { title: 'Edit listing', nav: 'property', requiresAuth: true, roles: ['user'], hideFooter: true },
      },

      /* Outcomes */
      { path: 'submitted', name: 'interest-submitted', component: () => import('@/views/checkout/InterestSubmittedView.vue'), meta: { title: 'Interest submitted', hideFooter: true, noindex: true } },
      { path: 'payments/callback', name: 'payment-callback', component: () => import('@/views/checkout/PaymentResultView.vue'), meta: { title: 'Payment status', requiresAuth: true, hideFooter: true } },

      /* Errors */
      { path: '403', name: 'forbidden', component: () => import('@/views/errors/ForbiddenView.vue'), meta: { title: 'Access denied', noindex: true } },
    ],
  },

  /* Authentication & onboarding (logo-only header, grey canvas) */
  {
    path: '/',
    component: AuthLayout,
    children: [
      { path: 'login', name: 'login', component: () => import('@/views/auth/LoginView.vue'), meta: { title: 'Log in', guestOnly: true } },
      { path: 'register', name: 'register', component: () => import('@/views/auth/RegisterView.vue'), meta: { title: 'Create an account', guestOnly: true } },
      { path: 'forgot-password', name: 'forgot-password', component: () => import('@/views/auth/ForgotPasswordView.vue'), meta: { title: 'Forgot password', guestOnly: true } },
      { path: 'auth/google/callback', name: 'google-callback', component: () => import('@/views/auth/GoogleCallbackView.vue'), meta: { title: 'Signing in', noindex: true } },
      { path: 'verify-email', name: 'verify-email', component: () => import('@/views/auth/VerifyEmailView.vue'), meta: { title: 'Verify your email', requiresAuth: true, allowUnverified: true } },
      { path: 'account-created', name: 'account-created', component: () => import('@/views/auth/AccountCreatedView.vue'), meta: { title: 'Account created', requiresAuth: true } },
      { path: 'onboarding', name: 'onboarding', component: () => import('@/views/onboarding/ProfileSetupView.vue'), meta: { title: 'Set up your profile', requiresAuth: true, roles: ['user'] } },
      { path: 'onboarding/complete', name: 'onboarding-complete', component: () => import('@/views/onboarding/ProfileCompleteView.vue'), meta: { title: 'Profile setup complete', requiresAuth: true, roles: ['user'] } },
    ],
  },

  /* Customer dashboard */
  {
    path: '/dashboard',
    component: DashboardLayout,
    meta: { requiresAuth: true, roles: ['user'], hideFooter: true },
    children: [
      { path: '', name: 'dashboard', redirect: { name: 'dashboard-buyback' } },
      { path: 'buyback', name: 'dashboard-buyback', component: () => import('@/views/dashboard/BuybackDashboardView.vue'), meta: { title: 'Buyback dashboard' } },
      { path: 'buyback/:id', name: 'dashboard-buyback-position', component: () => import('@/views/dashboard/BuybackPositionView.vue'), props: (r) => ({ id: Number(r.params.id) }), meta: { title: 'Buyback position' } },
      { path: 'capital-investment', name: 'dashboard-capital', component: () => import('@/views/dashboard/CapitalDashboardView.vue'), meta: { title: 'Capital investment dashboard' } },
      { path: 'capital-investment/:id', name: 'dashboard-capital-position', component: () => import('@/views/dashboard/CapitalPositionView.vue'), props: (r) => ({ id: Number(r.params.id) }), meta: { title: 'Investment details' } },
      { path: 'property-management', name: 'dashboard-property', component: () => import('@/views/dashboard/PropertyDashboardView.vue'), meta: { title: 'Property management' } },
      { path: 'property-management/listings/:id', name: 'dashboard-listing', component: () => import('@/views/dashboard/ListingDetailView.vue'), props: (r) => ({ id: Number(r.params.id) }), meta: { title: 'Listing details' } },
      { path: 'property-management/holdings/:id', name: 'dashboard-holding', component: () => import('@/views/dashboard/HoldingDetailView.vue'), props: (r) => ({ id: Number(r.params.id) }), meta: { title: 'Property details' } },
      { path: 'transactions', name: 'dashboard-transactions', component: () => import('@/views/dashboard/TransactionsView.vue'), meta: { title: 'Payment history' } },
      { path: 'notifications', name: 'dashboard-notifications', component: () => import('@/views/dashboard/NotificationsView.vue'), meta: { title: 'Notifications' } },
      {
        path: 'settings/:section(profile|account|payout|notifications|security|support)?',
        name: 'dashboard-settings',
        component: () => import('@/views/dashboard/settings/SettingsView.vue'),
        meta: { title: 'Settings' },
      },
    ],
  },

  /* Administration */
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, roles: ['admin', 'super_admin'] },
    children: [
      { path: '', name: 'admin-dashboard', component: () => import('@/views/admin/AdminDashboardView.vue'), meta: { title: 'Admin dashboard', permissions: ['dashboard.view'] } },
      { path: 'users', name: 'admin-users', component: () => import('@/views/admin/AdminUsersView.vue'), meta: { title: 'Users', permissions: ['users.view'] } },
      { path: 'users/:id', name: 'admin-user', component: () => import('@/views/admin/AdminUserDetailView.vue'), props: (r) => ({ id: Number(r.params.id) }), meta: { title: 'User', permissions: ['users.view'] } },
      { path: 'estates', name: 'admin-estates', component: () => import('@/views/admin/AdminEstatesView.vue'), meta: { title: 'Estates', permissions: ['estates.view'] } },
      { path: 'listings', name: 'admin-listings', component: () => import('@/views/admin/AdminListingsView.vue'), meta: { title: 'Listings', permissions: ['listings.view'] } },
      { path: 'investments', name: 'admin-investments', component: () => import('@/views/admin/AdminInvestmentsView.vue'), meta: { title: 'Investments', permissions: ['investments.view'] } },
      { path: 'transactions', name: 'admin-transactions', component: () => import('@/views/admin/AdminTransactionsView.vue'), meta: { title: 'Transactions', permissions: ['transactions.view'] } },
      { path: 'requests', name: 'admin-requests', component: () => import('@/views/admin/AdminRequestsView.vue'), meta: { title: 'Requests', permissions: ['requests.view'] } },
      { path: 'content', name: 'admin-content', component: () => import('@/views/admin/AdminContentView.vue'), meta: { title: 'Content', permissions: ['content.manage'] } },
      { path: 'media', name: 'admin-media', component: () => import('@/views/admin/AdminMediaView.vue'), meta: { title: 'Media library', permissions: ['media.manage'] } },
      { path: 'reports', name: 'admin-reports', component: () => import('@/views/admin/AdminReportsView.vue'), meta: { title: 'Reports', permissions: ['reports.view'] } },
      { path: 'settings', name: 'admin-settings', component: () => import('@/views/admin/AdminSettingsView.vue'), meta: { title: 'System settings', permissions: ['settings.view'] } },
      { path: 'admins', name: 'admin-admins', component: () => import('@/views/admin/AdminAdminsView.vue'), meta: { title: 'Administrators', roles: ['super_admin'], permissions: ['admins.manage'] } },
      { path: 'roles', name: 'admin-roles', component: () => import('@/views/admin/AdminRolesView.vue'), meta: { title: 'Roles & permissions', roles: ['super_admin'], permissions: ['roles.manage'] } },
    ],
  },

  /* Development-only Paystack checkout simulator (mock API) */
  ...(import.meta.env.VITE_USE_MOCK_API === 'true'
    ? [{ path: '/dev/paystack-checkout', name: 'dev-paystack', component: () => import('@/views/dev/MockPaystackView.vue'), meta: { title: 'Paystack (simulated)', noindex: true } }]
    : []),

  {
    path: '/:pathMatch(.*)*',
    component: PublicLayout,
    children: [{ path: '', name: 'not-found', component: () => import('@/views/errors/NotFoundView.vue'), meta: { title: 'Page not found', noindex: true } }],
  },
]
