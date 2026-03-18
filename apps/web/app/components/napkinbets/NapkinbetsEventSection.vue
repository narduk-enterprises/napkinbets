<script setup lang="ts">
import type { NapkinbetsEventCard } from '../../../types/napkinbets'

const props = withDefaults(
  defineProps<{
    label: string
    description: string
    events: NapkinbetsEventCard[]
    limit?: number
  }>(),
  { limit: 20 },
)

const displayEvents = computed(() => props.events.slice(0, props.limit))
</script>

<template>
  <div class="napkinbets-section-stack">
    <div class="flex items-end justify-between gap-3">
      <div class="space-y-0.5">
        <h2 class="napkinbets-section-title">{{ label }}</h2>
        <p class="napkinbets-section-description">{{ description }}</p>
      </div>

      <span class="text-sm text-muted whitespace-nowrap">{{ displayEvents.length }} games</span>
    </div>

    <div class="napkinbets-scroll-strip">
      <NapkinbetsEventCard
        v-for="event in displayEvents"
        :key="event.id"
        :event="event"
        :countdown="label === 'Starting soon'"
      />
    </div>
  </div>
</template>
