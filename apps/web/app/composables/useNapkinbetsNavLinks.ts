interface NapkinbetsNavLink {
  label: string
  to: string
  icon: string
  requiresAuth?: boolean
  adminOnly?: boolean
}

const BASE_NAV_LINKS: NapkinbetsNavLink[] = [
  { label: 'Home', to: '/', icon: 'i-lucide-house' },
  { label: 'Discover', to: '/discover', icon: 'i-lucide-calendar-range' },
  { label: 'Create', to: '/wagers/create', icon: 'i-lucide-ticket-plus' },
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: 'i-lucide-layout-dashboard',
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

export function useNapkinbetsNavLinks() {
  const route = useRoute()
  const { loggedIn, user } = useUserSession()

  const isAuthenticated = computed(() => Boolean(loggedIn.value))
  const isAdmin = computed(() => Boolean(user.value?.isAdmin))

  const publicLinks = computed(() =>
    BASE_NAV_LINKS.filter((link) => !link.requiresAuth && !link.adminOnly).map((link) => ({
      ...link,
      active:
        link.to === '/'
          ? route.path === '/'
          : route.path === link.to || route.path.startsWith(`${link.to}/`),
    })),
  )

  const links = computed(() =>
    BASE_NAV_LINKS.filter((link) => {
      if (link.adminOnly && !isAdmin.value) {
        return false
      }

      if (link.requiresAuth && !isAuthenticated.value) {
        return false
      }

      return true
    }).map((link) => ({
      ...link,
      active:
        link.to === '/'
          ? route.path === '/'
          : route.path === link.to || route.path.startsWith(`${link.to}/`),
    })),
  )

  return {
    links,
    publicLinks,
    isAdmin,
    isAuthenticated,
    user,
  }
}
