<script setup lang="ts">
defineProps<{
  avatarUrl?: string | null
  displayName: string
  subtitle?: string | null
}>()
</script>

<template>
  <div class="flex items-center gap-3 min-w-0">
    <UAvatar :src="avatarUrl || undefined" :alt="displayName" size="sm" />
    <div class="min-w-0 space-y-1">
      <p class="font-semibold text-default">{{ displayName }}</p>
      <p v-if="subtitle" class="truncate text-sm text-muted">{{ subtitle }}</p>
    </div>
  </div>
</template>
