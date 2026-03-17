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
    <div class="napkinbets-hero">
      <div class="space-y-4">
        <p class="napkinbets-kicker">Discovery</p>
        <h1 class="napkinbets-section-title">Start from current and upcoming sports events.</h1>
        <p class="napkinbets-hero-lede">
          ESPN-backed event cache first, then fast board setup. The board ideas stay social and
          human-readable instead of feeling like sportsbook sludge.
        </p>
        <div class="napkinbets-card-actions">
          <UButton
            to="/wagers/create?createMode=manual"
            color="primary"
            icon="i-lucide-ticket-plus"
          >
            Create manual board
          </UButton>
          <UButton
            to="/settings/payments"
            color="neutral"
            variant="soft"
            icon="i-lucide-wallet-cards"
          >
            Payment rails
          </UButton>
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

    <div class="napkinbets-metric-grid">
      <NapkinbetsMetricCard v-for="metric in metrics" :key="metric.label" :metric="metric" />
    </div>

    <UCard class="napkinbets-panel">
      <div class="space-y-4">
        <div class="space-y-2">
          <p class="napkinbets-kicker">Filters</p>
          <h2 class="napkinbets-subsection-title">Trim the slate to what matters right now</h2>
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

    <div class="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div class="space-y-6">
        <div
          v-for="section in filteredSections"
          :key="section.key"
          class="napkinbets-section-stack"
        >
          <div class="space-y-2">
            <p class="napkinbets-kicker">{{ section.label }}</p>
            <h2 class="napkinbets-section-title">{{ section.description }}</h2>
          </div>

          <div class="napkinbets-live-grid">
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
          <div class="space-y-2">
            <p class="napkinbets-kicker">Prop flavors</p>
            <h2 class="napkinbets-subsection-title">Ideas beyond a straight game winner</h2>
            <p class="napkinbets-support-copy">
              Keep these as secondary prompts. Discovery should start from the real event, then
              layer on one or two social side markets.
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
</template>
