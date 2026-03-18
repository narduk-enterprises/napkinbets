<script setup lang="ts">
const props = defineProps<{
  path: string
  label: string
  ogUrl: string
}>()

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig.public?.siteUrl || ''

const fullOgUrl = computed(() => {
  if (!props.ogUrl) return ''
  // In production use the full URL, locally use relative
  if (siteUrl) return `${siteUrl}${props.ogUrl}`
  return props.ogUrl
})

const displayUrl = computed(() => {
  if (!props.ogUrl) return ''
  try {
    const decoded = decodeURIComponent(props.ogUrl)
    // Truncate for display
    return decoded.length > 80 ? `${decoded.slice(0, 77)}...` : decoded
  } catch {
    return props.ogUrl
  }
})

const hasError = ref(false)

function onImageError() {
  hasError.value = true
}
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
        <span v-if="hasError" class="absolute text-error text-sm z-0">Failed to render</span>

        <img
          v-if="fullOgUrl && !hasError"
          :src="fullOgUrl"
          :alt="`OG Image for ${label}`"
          class="w-full h-full object-cover relative z-10 transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
          @error="onImageError"
        />
      </div>
      <div class="p-3 bg-elevated border-t border-default flex items-center justify-between text-xs text-dimmed">
        <span class="truncate pr-4">{{ displayUrl || '...' }}</span>
        <UButton
          v-if="fullOgUrl"
          :to="fullOgUrl"
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
