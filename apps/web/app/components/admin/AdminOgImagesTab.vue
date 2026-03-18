<script setup lang="ts">
const ogImages = [
  {
    category: 'Pages',
    items: [
      { label: 'Home Page', path: '/' },
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Discover', path: '/discover' },
      { label: 'Guide', path: '/guide' },
      { label: 'Ledger', path: '/ledger' },
    ],
  },
  {
    category: 'Seed Wagers',
    items: [
      { label: 'Group Bet (Hoops)', path: '/wagers/demo-hoops-night' },
      { label: 'Group Bet (Soccer)', path: '/wagers/demo-soccer-watch' },
      { label: 'Golf Draft', path: '/wagers/demo-golf-draft' },
      { label: 'Simple Bet (Yankees)', path: '/wagers/yankees-rays-spring-1' },
    ],
  },
  {
    category: 'Seed Groups',
    items: [
      { label: 'Friday Night Watch', path: '/groups/friday-night-watch' },
      { label: 'Augusta Text Chain', path: '/groups/augusta-text-chain' },
      { label: 'HODLRZ', path: '/groups/hodlrz' },
    ],
  },
]

function getOgImageUrl(path: string) {
  // Nuxt OG Image v6 default output path is /__og-image__/image<path>/og.png
  const normalizedPath = path === '/' ? '' : path
  return `/__og-image__/image${normalizedPath}/og.png`
}
</script>

<template>
  <div class="space-y-12">
    <div class="max-w-2xl">
      <h2 class="napkinbets-section-title">OG Images Explorer</h2>
      <p class="napkinbets-text-muted mt-2">
        Preview the generated Open Graph images for various routes across the application. These images are generated on the edge via Takumi using seed data parameters where applicable.
      </p>
    </div>

    <div v-for="section in ogImages" :key="section.category" class="space-y-6">
      <h3 class="text-lg font-semibold text-default border-b border-default pb-2">
        {{ section.category }}
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div v-for="item in section.items" :key="item.path" class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h4 class="font-medium text-default">{{ item.label }}</h4>
            <UButton
              :to="item.path"
              target="_blank"
              variant="link"
              color="neutral"
              icon="i-lucide-external-link"
              size="sm"
            >
              {{ item.path }}
            </UButton>
          </div>
          
          <div class="card-base p-1 overflow-hidden group">
            <div class="aspect-1200/630 relative bg-muted rounded-md overflow-hidden flex items-center justify-center">
              <span class="absolute text-muted text-sm z-0">Loading...</span>
              <NuxtImg
                :src="getOgImageUrl(item.path)"
                :alt="`OG Image for ${item.label}`"
                class="w-full h-full object-cover relative z-10 transition-transform duration-500 group-hover:scale-[1.02]"
                loading="lazy"
              />
            </div>
            <div class="p-3 bg-elevated border-t border-default flex items-center justify-between text-xs text-dimmed">
              <span class="truncate pr-4">{{ getOgImageUrl(item.path) }}</span>
              <UButton
                :to="getOgImageUrl(item.path)"
                target="_blank"
                variant="ghost"
                color="neutral"
                icon="i-lucide-download"
                size="xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
