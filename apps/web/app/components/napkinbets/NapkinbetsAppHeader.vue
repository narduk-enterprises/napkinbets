<script setup lang="ts">
const { primaryLinks, accountLinks, isAuthenticated, user } = useNapkinbetsNavLinks()
const { logout } = useAuth()

const accountLabel = computed(() => {
  const name = user.value?.name
  if (typeof name === 'string' && name.trim()) {
    return name.trim().split(' ')[0]
  }

  return user.value?.email || 'Account'
})

const headerLinks = computed(() =>
  primaryLinks.value.filter((link) => ['/events', '/guide', '/napkins/create'].includes(link.to)),
)

const accountMenuItems = computed(() => {
  const navigationItems = [
    ...primaryLinks.value.filter((link) => link.to === '/dashboard'),
    ...accountLinks.value,
  ].map((link) => ({
    label: link.label,
    icon: link.icon,
    to: link.to,
  }))

  return [
    navigationItems,
    [
      {
        label: 'Sign out',
        icon: 'i-lucide-log-out',
        onSelect: async () => {
          await signOut()
        },
      },
    ],
  ]
})

async function signOut() {
  await logout()
  await navigateTo('/login', { replace: true })
}
</script>

<template>
  <div class="napkinbets-header-wrap">
    <div class="napkinbets-header">
      <div class="napkinbets-header-top">
        <NuxtLink to="/" class="napkinbets-header-brand">
          <NapkinbetsLogo compact />
        </NuxtLink>

        <div class="napkinbets-header-nav">
          <NuxtLink
            v-for="link in headerLinks"
            :key="link.to"
            :to="link.to"
            class="napkinbets-nav-link"
            :class="{ 'napkinbets-nav-link-active': link.active }"
          >
            <UIcon :name="link.icon" class="size-4" />
            <span>{{ link.label }}</span>
          </NuxtLink>
        </div>

        <div class="napkinbets-header-actions">
          <div v-if="isAuthenticated" class="flex items-center gap-2">
            <UDropdownMenu :items="accountMenuItems" :popper="{ placement: 'bottom-end' }">
              <UButton color="neutral" variant="soft" size="sm" icon="i-lucide-user-round">
                {{ accountLabel }}
              </UButton>
            </UDropdownMenu>
          </div>

          <div v-else class="flex items-center gap-3">
            <UButton
              to="/login"
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-lucide-log-in"
              class="hidden sm:inline-flex"
            >
              Log in
            </UButton>
            <UButton to="/register" color="primary" size="sm" icon="i-lucide-user-plus">
              Join
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
