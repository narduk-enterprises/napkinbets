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

useNapkinbetsAutoRefresh(discoverState.refresh)

useSeo({
  title: 'Browse live and upcoming games',
  description:
    'Browse live and upcoming games, then start a pool from real sports context instead of typing everything by hand.',
  image: '/brand/og/discover.webp',
})

useWebPageSchema({
  name: 'Napkinbets Games',
  description:
    'A sports schedule browser for starting friendly pools from live and upcoming games.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero napkinbets-hero-compact">
      <div class="napkinbets-hero-grid napkinbets-hero-grid-discovery">
        <div class="space-y-4">
          <p class="napkinbets-kicker">Events</p>
          <h1 class="napkinbets-section-title">Start from tonight&apos;s games.</h1>
          <p class="napkinbets-hero-lede">
            Pick a real game, keep the terms short, and start a pool without typing the whole
            setup from scratch.
          </p>
          <div class="napkinbets-card-actions">
            <UButton
              to="/napkins/create?createMode=manual"
              color="primary"
              icon="i-lucide-ticket-plus"
            >
              Start a custom pool
            </UButton>
            <UButton
              to="/settings/payments"
              color="neutral"
              icon="i-lucide-wallet-cards"
            >
              Payment setup
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
      title="Games failed to load"
      :description="discoverState.error.value.message"
    />

    <UCard class="napkinbets-panel napkinbets-filter-panel">
      <div class="space-y-4">
        <div class="space-y-1">
          <p class="napkinbets-kicker">Filters</p>
          <h2 class="napkinbets-subsection-title">Narrow the games</h2>
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
            <p class="napkinbets-kicker">Featured</p>
            <h2 class="napkinbets-subsection-title">Tournaments and watch-list games</h2>
          </div>

          <UButton
            to="/napkins/create?createMode=manual&preset=masters-week"
            color="neutral"
            variant="ghost"
            icon="i-lucide-flag"
          >
            Masters quick start
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

        <UCard class="napkinbets-panel">
          <div class="space-y-4">
            <div class="space-y-1">
              <p class="napkinbets-kicker">Quick angles</p>
              <h2 class="napkinbets-subsection-title">Formats that are easy to settle</h2>
            </div>

            <div class="space-y-3">
              <NapkinbetsPropIdeaCard
                v-for="idea in discover.propIdeas.slice(0, 2)"
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
