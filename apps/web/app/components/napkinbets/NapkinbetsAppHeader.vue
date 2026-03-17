<script setup lang="ts">
import { ref, watch } from 'vue'

const route = useRoute()
const { primaryLinks, publicLinks, accountLinks, isAuthenticated } = useNapkinbetsNavLinks()
const { logout } = useAuth()

const isMobileMenuOpen = ref(false)

const headerLinks = computed(() =>
  primaryLinks.value.filter((link) => ['/dashboard', '/events', '/napkins/create'].includes(link.to)),
)

const mobilePrimaryLinks = computed(() =>
  (isAuthenticated.value ? primaryLinks.value : publicLinks.value).filter((link) =>
    ['/events', '/napkins/create', '/dashboard', '/guide'].includes(link.to),
  ),
)

const mobileSecondaryLinks = computed(() =>
  isAuthenticated.value
    ? accountLinks.value.filter((link) => ['/friends', '/settings/payments'].includes(link.to))
    : [
        {
          label: 'Join',
          to: '/register',
          icon: 'i-lucide-user-plus',
        },
        {
          label: 'Log in',
          to: '/login',
          icon: 'i-lucide-log-in',
        },
      ],
)

watch(
  () => route.fullPath,
  () => {
    isMobileMenuOpen.value = false
  },
)

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

async function signOut() {
  closeMobileMenu()
  await logout()
  await navigateTo('/login', { replace: true })
}
</script>

<template>
  <div class="napkinbets-header-wrap">
    <div class="napkinbets-header">
      <div class="napkinbets-header-top">
        <NuxtLink to="/dashboard" class="napkinbets-header-brand" @click="closeMobileMenu">
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
          <UButton
            color="neutral"
            variant="soft"
            size="sm"
            icon="i-lucide-menu"
            aria-label="Open navigation"
            class="lg:hidden"
            @click="toggleMobileMenu"
          />

          <div v-if="isAuthenticated" class="hidden items-center gap-1 lg:flex">
            <NapkinbetsNotificationBell />
            <NapkinbetsUserMenu />
          </div>

          <div v-else class="hidden items-center gap-3 lg:flex">
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

    <div v-if="isMobileMenuOpen" class="napkinbets-mobile-menu-panel lg:hidden">
      <div class="napkinbets-mobile-menu-section">
        <UButton
          v-for="link in mobilePrimaryLinks"
          :key="link.to"
          :to="link.to"
          color="neutral"
          variant="ghost"
          size="sm"
          class="w-full justify-start"
          :icon="link.icon"
          @click="closeMobileMenu"
        >
          {{ link.label }}
        </UButton>
      </div>

      <div class="napkinbets-mobile-menu-section">
        <UButton
          v-for="link in mobileSecondaryLinks"
          :key="link.to"
          :to="link.to"
          color="neutral"
          variant="ghost"
          size="sm"
          class="w-full justify-start"
          :icon="link.icon"
          @click="closeMobileMenu"
        >
          {{ link.label }}
        </UButton>
      </div>

      <div v-if="isAuthenticated" class="napkinbets-mobile-menu-section">
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-log-out"
          class="w-full justify-start"
          @click="signOut"
        >
          Sign out
        </UButton>
      </div>
    </div>
  </div>
</template>
