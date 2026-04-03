<script setup lang="ts">
const discoverState = await useNapkinbetsDiscover()
const discover = computed(() => discoverState.data.value)
const {
  selectedSport,
  selectedLeague,
  selectedState,
  sportOptions,
  leagueOptions,
  stateOptions,
  filteredSections,
  metrics,
  hasFilteredResults,
} = useNapkinbetsDiscoverPresentation(discover)

useNapkinbetsAutoRefresh(discoverState.refresh, 30_000)

useSeo({
  title: 'Browse live and upcoming games',
  description:
    'Browse live and upcoming sports events, then attach the right pool or side-game format with real context.',
  ogImage: {
    title: 'Browse live and upcoming games',
    description: 'Start from a real event when the format needs live context.',
    icon: '📡',
  },
})

useWebPageSchema({
  name: 'Napkinbets Games',
  description:
    'A sports schedule browser for attaching real live context to winner pools, golf formats, and social game templates.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero napkinbets-hero-compact">
      <div class="napkinbets-hero-grid napkinbets-hero-grid-discovery">
        <div class="space-y-2">
          <p class="napkinbets-kicker">Events</p>
          <h1 class="napkinbets-section-title">
            Start from a real event when live context matters.
          </h1>
          <p class="napkinbets-hero-lede">
            Use the schedule when a matchup, tournament, or golf event should anchor the pool,
            picks, and standings.
          </p>
          <UButton
            to="/templates"
            color="neutral"
            variant="soft"
            size="sm"
            icon="i-lucide-layout-template"
          >
            Browse templates
          </UButton>
        </div>

        <div class="napkinbets-hero-stack napkinbets-hero-stack-compact">
          <div class="napkinbets-chip-grid">
            <span
              v-for="metric in metrics"
              :key="metric.label"
              class="napkinbets-hero-pill napkinbets-hero-pill-metric"
            >
              <UIcon :name="metric.icon" class="size-4 text-primary" />
              <strong>{{ metric.value }}</strong>
              <span>{{ metric.label }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <UAlert
      v-if="discoverState.error.value"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Games failed to load"
      :description="discoverState.error.value.message"
    />

    <div v-if="discover.spotlights.length" class="napkinbets-section-stack">
      <div class="space-y-0.5">
        <h2 class="napkinbets-section-title">Featured</h2>
        <p class="napkinbets-section-description">Big events worth turning into a group game</p>
      </div>

      <div class="napkinbets-scroll-strip">
        <NapkinbetsSpotlightCard
          v-for="spotlight in discover.spotlights"
          :key="spotlight.id"
          :spotlight="spotlight"
        />
      </div>
    </div>

    <ClientOnly>
      <NapkinbetsEventsGamesFilters
        :sport-options="sportOptions"
        :league-options="leagueOptions"
        :state-options="stateOptions"
        :selected-sport="selectedSport"
        :selected-league="selectedLeague"
        :selected-state="selectedState"
        @update:selected-sport="selectedSport = $event"
        @update:selected-league="selectedLeague = $event"
        @update:selected-state="selectedState = $event"
      />

      <template #fallback>
        <div class="napkinbets-panel napkinbets-filter-panel space-y-2 p-4">
          <h2 class="napkinbets-section-title">Filters</h2>
          <p class="napkinbets-section-description">Filters load with the interactive schedule.</p>
        </div>
      </template>
    </ClientOnly>

    <div class="space-y-6">
      <NapkinbetsEventSection
        v-for="section in filteredSections"
        :key="section.key"
        :label="section.label"
        :description="section.description"
        :events="section.events"
      />

      <UAlert
        v-if="!hasFilteredResults && !discoverState.pending.value"
        color="info"
        variant="soft"
        icon="i-lucide-search-x"
        title="No events match these filters"
        description="Try a different sport, league, or status to bring more games back in."
      />
    </div>
  </div>
</template>
