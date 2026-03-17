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
      <div class="space-y-1">
        <p class="napkinbets-kicker">Featured</p>
        <h2 class="napkinbets-subsection-title">Big events worth a closer look</h2>
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
      <UCard class="napkinbets-panel napkinbets-filter-panel">
        <div class="space-y-3">
          <div class="space-y-1">
            <p class="napkinbets-kicker">Filters</p>
            <h2 class="napkinbets-subsection-title">Filter games</h2>
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
                  @click="selectedSport = selectedSport === opt.value ? 'all' : opt.value"
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
                  @click="selectedLeague = selectedLeague === opt.value ? 'all' : opt.value"
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
                  @click="selectedState = selectedState === opt.value ? 'all' : opt.value"
                >
                  {{ opt.label }}
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <template #fallback>
        <div class="napkinbets-panel napkinbets-filter-panel space-y-2 p-4">
          <p class="napkinbets-kicker">Filters</p>
          <h2 class="napkinbets-subsection-title">Filter games</h2>
          <p class="text-sm text-muted">Filters load with the interactive schedule.</p>
        </div>
      </template>
    </ClientOnly>

    <div class="space-y-6">
      <div
        v-for="section in filteredSections"
        :key="section.key"
        class="napkinbets-section-stack"
      >
        <div class="flex items-end justify-between gap-3">
          <div class="space-y-1">
            <p class="napkinbets-kicker">{{ section.label }}</p>
            <h2 class="napkinbets-subsection-title">{{ section.description }}</h2>
          </div>

          <span class="text-sm text-default">{{ section.events.length }} games</span>
        </div>

        <div class="napkinbets-scroll-strip">
          <NapkinbetsEventCard v-for="event in section.events" :key="event.id" :event="event" />
        </div>
      </div>

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
