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
        <AdminOgImagePreview 
          v-for="item in section.items" 
          :key="item.path"
          :path="item.path"
          :label="item.label" 
        />
      </div>
    </div>
  </div>
</template>
