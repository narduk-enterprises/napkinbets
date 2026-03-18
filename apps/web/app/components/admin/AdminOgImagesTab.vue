<script setup lang="ts">
const { data, status } = useOgImageData()

const ogSections = computed(() => data.value?.sections ?? [])
</script>

<template>
  <div class="space-y-12">
    <div class="max-w-2xl">
      <h2 class="napkinbets-section-title">OG Images Explorer</h2>
      <p class="napkinbets-text-muted mt-2">
        Preview Open Graph images across the application. Wagers, groups, and events are loaded from the connected database.
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
          :og-url="item.ogUrl"
        />
      </div>
    </div>
  </div>
</template>
