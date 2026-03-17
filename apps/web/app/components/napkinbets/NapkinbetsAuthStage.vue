<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  description: string
}>()
</script>

<template>
  <div class="napkinbets-auth-stage">
    <div class="space-y-3">
      <p class="napkinbets-kicker">{{ eyebrow }}</p>
      <h2 class="napkinbets-section-title">{{ title }}</h2>
      <p class="napkinbets-support-copy">
        {{ description }}
      </p>
    </div>

    <slot />
  </div>
</template>
