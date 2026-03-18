<script setup lang="ts">
definePageMeta({ middleware: ['admin'] })

const actions = useNapkinbetsActions(async () => {})

const items = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', slot: 'dashboard' },
  { label: 'Events', icon: 'i-lucide-calendar', slot: 'events' },
  { label: 'Bets', icon: 'i-lucide-ticket', slot: 'bets' },
  { label: 'AI', icon: 'i-lucide-sparkles', slot: 'ai' },
  { label: 'Taxonomy', icon: 'i-lucide-library-big', slot: 'taxonomy' },
  { label: 'Featured', icon: 'i-lucide-star', slot: 'featured' },
  { label: 'Users', icon: 'i-lucide-users', slot: 'users' },
  { label: 'OG Images', icon: 'i-lucide-image', slot: 'ogImages' },
]

const route = useRoute()
const router = useRouter()

const selectedTabIndex = computed({
  get() {
    const tabParam = route.query.tab as string
    const index = items.findIndex((item) => item.slot === tabParam)
    return index === -1 ? 0 : index
  },
  set(newIndex) {
    const item = items[newIndex]
    if (item) {
      router.replace({ query: { ...route.query, tab: item.slot } })
    }
  },
})
  title: 'Admin controls',
  description: 'Manage registered users, bets, event coverage, and control operator-only features.',
  ogImage: {
    title: 'Napkinbets Admin',
    description: 'User, event, and feature controls for the prototype.',
    icon: '🛡️',
  },
})

useWebPageSchema({
  name: 'Napkinbets Admin',
  description:
    'Administrative overview for users, event coverage, and feature controls in the Napkinbets prototype.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="space-y-4">
        <p class="napkinbets-kicker">Admin</p>
        <h1 class="napkinbets-section-title">Run the product, not just the bets.</h1>
        <p class="napkinbets-hero-lede">
          This route covers users, bet states, event coverage health, and operator-controlled AI
          toggles so the product stays explicit.
        </p>
      </div>
    </div>

    <UAlert
      v-if="actions.feedback.value"
      :color="actions.feedback.value.type === 'success' ? 'success' : 'error'"
      variant="soft"
      class="mb-6"
      :icon="
        actions.feedback.value.type === 'success'
          ? 'i-lucide-check-circle-2'
          : 'i-lucide-circle-alert'
      "
      :title="
        actions.feedback.value.type === 'success' ? 'Admin update applied' : 'Admin action failed'
      "
      :description="actions.feedback.value.text"
    />

    <UTabs v-model="selectedTabIndex" :items="items" class="mt-6">
      <template #dashboard>
        <div class="mt-6">
          <AdminDashboardTab />
        </div>
      </template>

      <template #events>
        <div class="mt-6">
          <AdminEventsTab />
        </div>
      </template>

      <template #bets>
        <div class="mt-6">
          <AdminBetsTab />
        </div>
      </template>

      <template #ai>
        <div class="mt-6">
          <AdminAiTab />
        </div>
      </template>

      <template #taxonomy>
        <div class="mt-6">
          <AdminTaxonomyTab />
        </div>
      </template>

      <template #featured>
        <div class="mt-6">
          <AdminFeaturedTab />
        </div>
      </template>

      <template #users>
        <div class="mt-6">
          <AdminUsersTab />
        </div>
      </template>

      <template #ogImages>
        <div class="mt-6">
          <AdminOgImagesTab />
        </div>
      </template>
    </UTabs>
  </div>
</template>
