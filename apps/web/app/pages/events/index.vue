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
    'Browse live and upcoming games, then start a bet from the game instead of typing everything by hand.',
  image: '/brand/og/discover.webp',
})

useWebPageSchema({
  name: 'Napkinbets Games',
  description: 'A sports schedule browser for starting friendly bets from live and upcoming games.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero napkinbets-hero-compact">
      <div class="napkinbets-hero-grid napkinbets-hero-grid-discovery">
        <div class="space-y-2">
          <p class="napkinbets-kicker">Events</p>
          <h1 class="napkinbets-section-title">Pick a game, then start a bet.</h1>
          <p class="napkinbets-hero-lede">
            Choose a live or upcoming game, then fill in the people, side, and stake.
          </p>
          <UButton to="/games" color="neutral" variant="soft" size="sm" icon="i-lucide-list">
            View all as timeline
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
        <p class="napkinbets-section-description">Big events worth a closer look</p>
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
