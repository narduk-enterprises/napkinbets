<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    compact?: boolean
    showTagline?: boolean
  }>(),
  {
    compact: false,
    showTagline: true,
  },
)
</script>

<template>
  <div class="napkinbets-logo-lockup" :class="{ 'napkinbets-logo-lockup-compact': props.compact }">
    <span class="napkinbets-logo-mark-shell">
      <img
        src="/brand/napkinbets-mark.svg"
        alt="Napkinbets"
        width="72"
        height="72"
        class="napkinbets-logo-mark"
      />
    </span>
    <div class="min-w-0">
      <p class="napkinbets-logo-name">Napkinbets</p>
      <p v-if="props.showTagline && !props.compact" class="napkinbets-logo-tagline">
        On the napkin, then in the room
      </p>
    </div>
  </div>
</template>
