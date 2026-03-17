<script setup lang="ts">
const route = useRoute()
const { mobileLinks } = useNapkinbetsNavLinks()

function isActive(to: string) {
  if (to === '/') {
    return route.path === '/'
  }

  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <div class="napkinbets-mobile-nav" aria-label="Primary navigation" role="navigation">
    <NuxtLink
      v-for="item in mobileLinks"
      :key="item.to"
      :to="item.to"
      class="napkinbets-mobile-nav-link"
      :class="{ 'napkinbets-mobile-nav-link-active': isActive(item.to) }"
      :aria-current="isActive(item.to) ? 'page' : undefined"
    >
      <UIcon :name="item.icon" class="size-5" />
      <span>{{ item.mobileLabel || item.label }}</span>
    </NuxtLink>
  </div>
</template>
