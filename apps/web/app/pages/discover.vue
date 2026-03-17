<script setup lang="ts">
const discoverState = await useNapkinbetsDiscover()
const discover = computed(() => discoverState.data.value)

const discoverMetrics = computed(() => [
  {
    label: 'Live boards to launch',
    value: String(discover.value.liveEvents.length),
    hint: 'events already in progress',
    icon: 'i-lucide-activity',
  },
  {
    label: 'Upcoming events',
    value: String(discover.value.upcomingEvents.length),
    hint: 'fresh matchups from ESPN',
    icon: 'i-lucide-calendar-range',
  },
  {
    label: 'Prop contexts',
    value: String(discover.value.propIdeas.length),
    hint: 'non-sportsbook style inspirations',
    icon: 'i-lucide-lightbulb',
  },
])

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
          ESPN provides the backbone for what is on deck and what is already moving. From there, Napkinbets adds social prop angles and manual settlement rails.
        </p>
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

    <div class="napkinbets-metric-grid">
      <NapkinbetsMetricCard
        v-for="metric in discoverMetrics"
        :key="metric.label"
        :metric="metric"
      />
    </div>

    <div class="napkinbets-section-stack">
      <div class="space-y-2">
        <p class="napkinbets-kicker">In progress</p>
        <h2 class="napkinbets-section-title">Events that need close-to-live context</h2>
      </div>

      <div v-if="discover.liveEvents.length" class="napkinbets-live-grid">
        <NapkinbetsEventCard
          v-for="event in discover.liveEvents"
          :key="event.id"
          :event="event"
        />
      </div>

      <UAlert
        v-else
        color="info"
        variant="soft"
        icon="i-lucide-info"
        title="No live events were returned"
        description="The discover service is still healthy, but there are no in-progress events in the supported leagues right now."
      />
    </div>

    <div class="napkinbets-section-stack">
      <div class="space-y-2">
        <p class="napkinbets-kicker">Upcoming</p>
        <h2 class="napkinbets-section-title">High-signal matchups worth turning into boards</h2>
      </div>

      <div class="napkinbets-live-grid">
        <NapkinbetsEventCard
          v-for="event in discover.upcomingEvents"
          :key="event.id"
          :event="event"
        />
      </div>
    </div>

    <div class="napkinbets-section-stack">
      <div class="space-y-2">
        <p class="napkinbets-kicker">Prop flavors</p>
        <h2 class="napkinbets-section-title">Ideas beyond a straight game winner</h2>
      </div>

      <div class="napkinbets-live-grid">
        <NapkinbetsPropIdeaCard
          v-for="idea in discover.propIdeas"
          :key="idea.id"
          :idea="idea"
        />
      </div>
    </div>
  </div>
</template>
