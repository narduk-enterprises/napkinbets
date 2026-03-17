<script setup lang="ts">
import type { NapkinbetsMetric } from '../../../types/napkinbets'

defineProps<{
  metric: NapkinbetsMetric
}>()
</script>

<template>
  <UCard class="napkinbets-panel napkinbets-metric-card">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-2">
        <p class="napkinbets-kicker">{{ metric.label }}</p>
        <p class="napkinbets-metric-value">{{ metric.value }}</p>
        <p class="napkinbets-support-copy">{{ metric.hint }}</p>
      </div>

      <div class="napkinbets-order-pill">
        <UIcon :name="metric.icon" class="size-4" />
      </div>
    </div>
  </UCard>
</template>
