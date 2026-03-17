<script setup lang="ts">
import { useNapkinbetsApi } from '../../services/napkinbets-api'

const { user, loggedIn, logout } = useAuth()
const { isAdmin } = useNapkinbetsNavLinks()

const notificationsState = loggedIn.value ? useNapkinbetsNotifications() : null
const unreadCount = computed(() => notificationsState?.data.value?.unreadCount ?? 0)

const isOpen = ref(false)

const profileState = loggedIn.value
  ? useAsyncData('napkinbets-profile', () => useNapkinbetsApi().getProfile(), {
      server: false,
      lazy: true,
    })
  : null

const avatarUrl = computed(() => profileState?.data.value?.avatarUrl ?? '')
const displayName = computed(() => user.value?.name || user.value?.email || 'User')
const initials = computed(() => {
  const name = displayName.value
  if (!name) return '?'
  const parts = name.split(/[\s@]+/)
  const firstInitial = parts[0]?.[0]
  const secondInitial = parts[1]?.[0]
  if (firstInitial && secondInitial) return (firstInitial + secondInitial).toUpperCase()
  return name.slice(0, 2).toUpperCase()
})

const menuLinks = computed(() => {
  const links = [
    { label: 'My Bets', to: '/dashboard', icon: 'i-lucide-layout-dashboard' },
    { label: 'Notifications', to: '/notifications', icon: 'i-lucide-bell' },
    { label: 'Friends', to: '/friends', icon: 'i-lucide-user-round-plus' },
    { label: 'Groups', to: '/groups', icon: 'i-lucide-users-round' },
    { label: 'Payments', to: '/settings/payments', icon: 'i-lucide-wallet-cards' },
    { label: 'Profile', to: '/settings', icon: 'i-lucide-settings' },
  ]

  if (isAdmin.value) {
    links.push({ label: 'Admin', to: '/admin', icon: 'i-lucide-shield-check' })
  }

  return links
})

async function signOut() {
  isOpen.value = false
  await logout()
  await navigateTo('/login', { replace: true })
}
</script>

<template>
  <ClientOnly>
    <UPopover v-if="loggedIn" v-model:open="isOpen">
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        class="napkinbets-user-menu-trigger"
        aria-label="User menu"
      >
        <span v-if="avatarUrl" class="napkinbets-user-avatar">
          <img :src="avatarUrl" alt="" class="napkinbets-user-avatar-img" />
        </span>
        <span v-else class="napkinbets-user-avatar napkinbets-user-avatar-initials">
          {{ initials }}
        </span>
        <span class="napkinbets-user-menu-name hidden sm:inline">{{ displayName }}</span>
        <UIcon name="i-lucide-chevron-down" class="size-3 text-dimmed" />
      </UButton>

      <template #content>
        <div class="napkinbets-user-dropdown">
          <div class="napkinbets-user-dropdown-header">
            <span v-if="avatarUrl" class="napkinbets-user-avatar napkinbets-user-avatar-lg">
              <img :src="avatarUrl" alt="" class="napkinbets-user-avatar-img" />
            </span>
            <span
              v-else
              class="napkinbets-user-avatar napkinbets-user-avatar-initials napkinbets-user-avatar-lg"
            >
              {{ initials }}
            </span>
            <div class="min-w-0">
              <p class="font-semibold text-default truncate">{{ displayName }}</p>
              <p class="text-xs text-muted truncate">{{ user?.email }}</p>
            </div>
          </div>

          <div class="napkinbets-user-dropdown-links">
            <NuxtLink
              v-for="link in menuLinks"
              :key="link.to"
              :to="link.to"
              class="napkinbets-user-dropdown-link"
              @click="isOpen = false"
            >
              <UIcon :name="link.icon" class="size-4 text-muted" />
              <span>{{ link.label }}</span>
              <UBadge
                v-if="link.to === '/notifications' && unreadCount > 0"
                color="primary"
                variant="soft"
                size="xs"
              >
                {{ unreadCount }}
              </UBadge>
            </NuxtLink>
          </div>

          <div class="napkinbets-user-dropdown-footer">
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-lucide-log-out"
              block
              class="justify-start"
              @click="signOut"
            >
              Sign out
            </UButton>
          </div>
        </div>
      </template>
    </UPopover>
  </ClientOnly>
</template>
