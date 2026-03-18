<script setup lang="ts">
import type { NapkinbetsDiscoverFilterOption } from '../../../types/napkinbets'

const props = withDefaults(
  defineProps<{
    sportOptions: NapkinbetsDiscoverFilterOption[]
    leagueOptions: NapkinbetsDiscoverFilterOption[]
    stateOptions: NapkinbetsDiscoverFilterOption[]
    selectedSport: string
    selectedLeague: string
    selectedState: string
    title?: string
    description?: string
  }>(),
  {
    title: 'Filters',
    description: 'Filter games',
  },
)

const emit = defineEmits<{
  'update:selectedSport': [value: string]
  'update:selectedLeague': [value: string]
  'update:selectedState': [value: string]
}>()

function toggleSport(value: string) {
  emit('update:selectedSport', props.selectedSport === value ? 'all' : value)
}

function toggleLeague(value: string) {
  emit('update:selectedLeague', props.selectedLeague === value ? 'all' : value)
}

function toggleState(value: string) {
  emit('update:selectedState', props.selectedState === value ? 'all' : value)
}
</script>

<template>
  <UCard class="napkinbets-panel napkinbets-filter-panel">
    <div class="space-y-3">
      <div class="space-y-0.5">
        <h2 class="napkinbets-section-title">{{ title }}</h2>
        <p class="napkinbets-section-description">{{ description }}</p>
      </div>

      <div class="space-y-2.5">
        <div v-if="sportOptions.length > 1">
          <p class="napkinbets-filter-chip-label">Sport</p>
          <div class="napkinbets-filter-chip-row">
            <UButton
              v-for="opt in sportOptions"
              :key="opt.value"
              size="xs"
              :color="selectedSport === opt.value ? 'primary' : 'neutral'"
              :variant="selectedSport === opt.value ? 'solid' : 'soft'"
              @click="toggleSport(opt.value)"
            >
              {{ opt.label }}
            </UButton>
          </div>
        </div>

        <div v-if="leagueOptions.length > 1">
          <p class="napkinbets-filter-chip-label">League</p>
          <div class="napkinbets-filter-chip-row">
            <UButton
              v-for="opt in leagueOptions"
              :key="opt.value"
              size="xs"
              :color="selectedLeague === opt.value ? 'primary' : 'neutral'"
              :variant="selectedLeague === opt.value ? 'solid' : 'soft'"
              @click="toggleLeague(opt.value)"
            >
              {{ opt.label }}
            </UButton>
          </div>
        </div>

        <div v-if="stateOptions.length > 1">
          <p class="napkinbets-filter-chip-label">Status</p>
          <div class="napkinbets-filter-chip-row">
            <UButton
              v-for="opt in stateOptions"
              :key="opt.value"
              size="xs"
              :color="selectedState === opt.value ? 'primary' : 'neutral'"
              :variant="selectedState === opt.value ? 'solid' : 'soft'"
              @click="toggleState(opt.value)"
            >
              {{ opt.label }}
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
