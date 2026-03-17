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
const refreshedAtLabel = computed(() =>
  discover.value.refreshedAt
    ? discover.value.refreshedAt.replace('T', ' ').replace('Z', ' UTC')
    : '',
)

useNapkinbetsAutoRefresh(discoverState.refresh)

useSeo({
  title: 'Discover current and upcoming events',
  description:
    'Browse live and upcoming events from ESPN-backed feeds, then spin them into friendly Napkinbets boards.',
  ogImage: {
    title: 'Napkinbets Discovery',
    description: 'Live and upcoming sports events ready for friendly wager boards.',
    icon: '📡',
  },
})

useWebPageSchema({
  name: 'Napkinbets Discovery',
  description:
    'A sports and prop discovery workflow for selecting current or upcoming events for friendly wagers.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero napkinbets-hero-compact">
      <div class="napkinbets-hero-grid napkinbets-hero-grid-discovery">
        <div class="space-y-4">
          <p class="napkinbets-kicker">Discovery</p>
          <h1 class="napkinbets-section-title">Find the event, then launch the board fast.</h1>
          <p class="napkinbets-hero-lede">
            Scan what is live, what is next, and where golf deserves a quick side board.
          </p>
          <div class="napkinbets-card-actions">
            <UButton
              to="/wagers/create?createMode=manual"
              color="primary"
              icon="i-lucide-ticket-plus"
            >
              Quick manual board
            </UButton>
            <UButton
              to="/settings/payments"
              color="neutral"
              variant="ghost"
              icon="i-lucide-wallet-cards"
            >
              Payment rails
            </UButton>
          </div>
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
      title="Discovery data failed to load"
      :description="discoverState.error.value.message"
    />

    <UAlert
      v-else-if="discover.stale"
      color="warning"
      variant="soft"
      icon="i-lucide-timer-reset"
      title="Showing the latest cached slate"
      :description="
        refreshedAtLabel
          ? `The event cache last refreshed at ${refreshedAtLabel}.`
          : 'The event cache has not refreshed yet.'
      "
    />

    <UCard class="napkinbets-panel napkinbets-filter-panel">
      <div class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <div class="space-y-1">
            <p class="napkinbets-kicker">Filters</p>
            <h2 class="napkinbets-subsection-title">Trim the slate</h2>
          </div>

          <p class="text-sm text-muted">
            {{ refreshedAtLabel ? `Synced ${refreshedAtLabel}` : 'Cache warming up' }}
          </p>
        </div>

        <div class="napkinbets-form-grid">
          <UFormField name="sportFilter" label="Sport">
            <USelect v-model="selectedSport" :items="sportOptions" class="w-full" />
          </UFormField>

          <UFormField name="leagueFilter" label="League">
            <USelect v-model="selectedLeague" :items="leagueOptions" class="w-full" />
          </UFormField>

          <UFormField name="stateFilter" label="Status">
            <USelect v-model="selectedState" :items="stateOptions" class="w-full" />
          </UFormField>
        </div>
      </div>
    </UCard>

    <div class="space-y-6">
      <div v-if="discover.spotlights.length" class="napkinbets-section-stack">
        <div class="flex items-end justify-between gap-3">
          <div class="space-y-1">
            <p class="napkinbets-kicker">Golf radar</p>
            <h2 class="napkinbets-subsection-title">Masters on deck, tours in motion</h2>
          </div>

          <UButton
            to="/wagers/create?createMode=manual&preset=masters-week"
            color="neutral"
            variant="ghost"
            icon="i-lucide-flag"
          >
            Masters preset
          </UButton>
        </div>

        <div class="napkinbets-scroll-strip">
          <NapkinbetsSpotlightCard
            v-for="spotlight in discover.spotlights"
            :key="spotlight.id"
            :spotlight="spotlight"
          />
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
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

              <span class="text-sm text-muted">{{ section.events.length }} in lane</span>
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
            description="Try widening the league or status filter to bring the slate back in."
          />
        </div>

        <UCard class="napkinbets-panel">
          <div class="space-y-4">
            <div class="space-y-1">
              <p class="napkinbets-kicker">Prop flavors</p>
              <h2 class="napkinbets-subsection-title">Social angles worth stealing</h2>
              <p class="napkinbets-support-copy">
                Start with the real event, then add one clean side market.
              </p>
            </div>

            <div class="space-y-3">
              <NapkinbetsPropIdeaCard
                v-for="idea in discover.propIdeas"
                :key="idea.id"
                :idea="idea"
              />
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
