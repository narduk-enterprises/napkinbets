<script setup lang="ts">
import type { NapkinbetsWager } from '../../../types/napkinbets'

defineProps<{
  label: string
  wagers: NapkinbetsWager[]
}>()
</script>

<template>
  <section v-if="wagers.length" class="space-y-3">
    <h3 class="text-sm font-semibold tracking-wide text-muted uppercase">{{ label }}</h3>
    <div class="space-y-2">
      <NapkinbetsNapkinSummaryCard
        v-for="wager in wagers"
        :key="wager.id"
        :wager="wager"
      />
    </div>
  </section>
</template>
