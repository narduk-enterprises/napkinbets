<script setup lang="ts">
import type { NapkinbetsMetric } from '../../../types/napkinbets'

defineProps<{
  metrics: NapkinbetsMetric[]
}>()

const shortLabel = (label: string): string => {
  const map: Record<string, string> = {
    'Bets you started': 'Started',
    'Bets you joined': 'Joined',
    'Pending invites': 'Invites',
    'Queued reminders': 'Reminders',
    'Open settlements': 'Settlements',
  }
  return map[label] ?? label
}
</script>

<template>
  <div class="napkinbets-stats-strip" role="list" aria-label="Dashboard summary">
    <div
      v-for="metric in metrics"
      :key="metric.label"
      class="napkinbets-stats-strip-item"
      role="listitem"
    >
      <UIcon :name="metric.icon" class="size-4 shrink-0 text-muted" aria-hidden="true" />
      <span class="napkinbets-stats-strip-value">{{ metric.value }}</span>
      <span class="napkinbets-stats-strip-label">{{ shortLabel(metric.label) }}</span>
    </div>
  </div>
</template>
