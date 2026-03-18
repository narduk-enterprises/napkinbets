<script setup lang="ts">
const props = defineProps<{
  path: string
  label: string
}>()

const { ogData, status } = useOgImagePreview(props.path)

const url = computed(() => ogData.value?.url || '')
const displayUrl = computed(() => {
  if (!url.value) return ''
  try {
    const parsed = new URL(url.value)
    return parsed.pathname + parsed.search
  } catch {
    return url.value
  }
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <h4 class="font-medium text-default">{{ label }}</h4>
      <UButton
        :to="path"
        target="_blank"
        variant="link"
        color="neutral"
        icon="i-lucide-external-link"
        size="sm"
      >
        {{ path }}
      </UButton>
    </div>
    
    <div class="card-base p-1 overflow-hidden group">
      <div class="aspect-1200/630 relative bg-muted rounded-md overflow-hidden flex items-center justify-center">
        <span v-if="status === 'pending'" class="absolute text-muted text-sm z-0">Loading URL...</span>
        <span v-else-if="!url" class="absolute text-error text-sm z-0">Failed to load</span>
        
        <img
          v-if="url"
          :src="url"
          :alt="`OG Image for ${label}`"
          class="w-full h-full object-cover relative z-10 transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
      </div>
      <div class="p-3 bg-elevated border-t border-default flex items-center justify-between text-xs text-dimmed">
        <span class="truncate pr-4">{{ displayUrl || '...' }}</span>
        <UButton
          v-if="url"
          :to="url"
          target="_blank"
          variant="ghost"
          color="neutral"
          icon="i-lucide-download"
          size="xs"
        />
      </div>
    </div>
  </div>
</template>
