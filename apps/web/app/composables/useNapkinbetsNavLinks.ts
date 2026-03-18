interface NapkinbetsNavLink {
  label: string
  to: string
  icon: string
  mobileLabel?: string
  requiresAuth?: boolean
  adminOnly?: boolean
}

const PRIMARY_NAV_LINKS: NapkinbetsNavLink[] = [
  { label: 'Home', to: '/', icon: 'i-lucide-house', mobileLabel: 'Home' },
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: 'i-lucide-layout-dashboard',
    mobileLabel: 'My',
    requiresAuth: true,
  },
  {
    label: 'Events',
    to: '/events',
    icon: 'i-lucide-radar',
    mobileLabel: 'Events',
  },
  {
    label: 'Games',
    to: '/games',
    icon: 'i-lucide-gamepad-2',
    mobileLabel: 'Games',
  },
  {
    label: 'Help',
    to: '/guide',
    icon: 'i-lucide-book-open-text',
    mobileLabel: 'Help',
  },
  {
    label: 'Create Napkin',
    to: '/napkins/create',
    icon: 'i-lucide-ticket-plus',
    mobileLabel: 'New',
  },
]

const ACCOUNT_LINKS: NapkinbetsNavLink[] = [
  {
    label: 'Friends',
    to: '/friends',
    icon: 'i-lucide-user-round-plus',
    requiresAuth: true,
  },
  {
    label: 'Groups',
    to: '/groups',
    icon: 'i-lucide-users-round',
    requiresAuth: true,
  },
  {
    label: 'Payments',
    to: '/settings/payments',
    icon: 'i-lucide-wallet-cards',
    requiresAuth: true,
  },
  {
    label: 'Admin',
    to: '/admin',
    icon: 'i-lucide-shield-check',
    requiresAuth: true,
    adminOnly: true,
  },
]

function withActiveState(routePath: string, links: NapkinbetsNavLink[]) {
  return links.map((link) => ({
    ...link,
    active:
      link.to === '/'
        ? routePath === '/'
        : routePath === link.to || routePath.startsWith(`${link.to}/`),
  }))
}

export function useNapkinbetsNavLinks() {
  const route = useRoute()
  const { loggedIn, user } = useAuth()

  const isAuthenticated = computed(() => Boolean(loggedIn.value))
  const isAdmin = computed(() => Boolean(user.value?.isAdmin))

  const primaryLinks = computed(() =>
    withActiveState(
      route.path,
      PRIMARY_NAV_LINKS.filter((link) => {
        if (link.requiresAuth && !isAuthenticated.value) {
          return false
        }

        return true
      }),
    ),
  )

  const accountLinks = computed(() =>
    withActiveState(
      route.path,
      ACCOUNT_LINKS.filter((link) => {
        if (link.adminOnly && !isAdmin.value) {
          return false
        }

        if (link.requiresAuth && !isAuthenticated.value) {
          return false
        }

        return true
      }),
    ),
  )

  const mobileLinks = computed(() => {
    if (isAuthenticated.value) {
      return primaryLinks.value
    }

    return withActiveState(route.path, [
      ...PRIMARY_NAV_LINKS.filter((link) => !link.requiresAuth),
      {
        label: 'Account',
        mobileLabel: 'Account',
        to: '/login',
        icon: 'i-lucide-log-in',
      },
    ])
  })

  const publicLinks = computed(() =>
    withActiveState(
      route.path,
      PRIMARY_NAV_LINKS.filter((link) => !link.requiresAuth),
    ),
  )

  return {
    primaryLinks,
    accountLinks,
    mobileLinks,
    publicLinks,
    isAdmin,
    isAuthenticated,
    user,
  }
}
