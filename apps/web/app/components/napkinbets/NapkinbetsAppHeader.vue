<script setup lang="ts">
const { links, isAuthenticated, user } = useNapkinbetsNavLinks()
const { logout } = useAuth()

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
          <NapkinbetsLogo />
        </NuxtLink>

        <div class="napkinbets-header-actions">
          <div v-if="isAuthenticated" class="flex items-center gap-3">
            <div class="napkinbets-user-pill">
              <UIcon name="i-lucide-user-round" class="size-4 text-primary" />
              <span>{{ user?.name || user?.email || 'Signed in' }}</span>
            </div>

            <UButton
              type="button"
              color="neutral"
              variant="soft"
              icon="i-lucide-log-out"
              @click="signOut"
            >
              Sign out
            </UButton>
          </div>

          <div v-else class="flex items-center gap-3">
            <UButton to="/login" color="neutral" variant="soft" icon="i-lucide-log-in">
              Log in
            </UButton>
            <UButton to="/register" color="primary" icon="i-lucide-user-plus">
              Create account
            </UButton>
          </div>
        </div>
      </div>

      <div class="napkinbets-nav-row">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="napkinbets-nav-link"
          :class="{ 'napkinbets-nav-link-active': link.active }"
        >
          <UIcon :name="link.icon" class="size-4" />
          <span>{{ link.label }}</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
