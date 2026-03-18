<script setup lang="ts">
const { data, status } = useOgImageData()

const ogSections = computed(() => {
  if (!data.value) return []

  const sections = [
    {
      category: 'Pages',
      items: [
        { label: 'Home Page', path: '/' },
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Discover', path: '/discover' },
        { label: 'Guide', path: '/guide' },
        { label: 'Ledger', path: '/ledger' },
        { label: 'Games', path: '/games' },
        { label: 'Tour', path: '/tour' },
      ],
    },
  ]

  if (data.value.wagers.length > 0) {
    sections.push({
      category: `Wagers (${data.value.wagers.length})`,
      items: data.value.wagers.map(w => ({
        label: w.title,
        path: `/wagers/${w.slug}`,
      })),
    })
  }

  if (data.value.groups.length > 0) {
    sections.push({
      category: `Groups (${data.value.groups.length})`,
      items: data.value.groups.map(g => ({
        label: g.name,
        path: `/groups/${g.slug}`,
      })),
    })
  }

  if (data.value.events.length > 0) {
    sections.push({
      category: `Events (${data.value.events.length})`,
      items: data.value.events.map(e => ({
        label: e.eventTitle,
        path: `/events/${e.id}`,
      })),
    })
  }

  return sections
})
</script>

<template>
  <div class="space-y-12">
    <div class="max-w-2xl">
      <h2 class="napkinbets-section-title">OG Images Explorer</h2>
      <p class="napkinbets-text-muted mt-2">
        Preview Open Graph images across the application. Data is loaded from the connected database — local D1 in dev, production D1 when deployed.
      </p>
    </div>

    <div v-if="status === 'pending'" class="flex items-center gap-3 text-muted">
      <UIcon name="i-lucide-loader-circle" class="animate-spin" />
      Loading data from database...
    </div>

    <div v-for="section in ogSections" :key="section.category" class="space-y-6">
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
