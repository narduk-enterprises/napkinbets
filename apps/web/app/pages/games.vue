<script setup lang="ts">
import type { NapkinbetsDiscoverFilterOption, NapkinbetsEventCard } from '../../types/napkinbets'

interface GamesTimelineItem {
  date: string
  title: string
  description: string
  icon: string
  value: string
  slot: 'game'
}

function withAllOption(
  label: string,
  options: NapkinbetsDiscoverFilterOption[],
): NapkinbetsDiscoverFilterOption[] {
  return [{ label, value: 'all' }, ...options]
}

const discoverState = await useNapkinbetsDiscover()
const discover = computed(() => discoverState.data.value)

const {
  events,
  nextCursor,
  loadMorePending,
  loadMore,
  initialFetch,
  selectedSport,
  selectedLeague,
  selectedState,
} = useNapkinbetsGamesTimeline()

const sportOptions = computed(() => withAllOption('All sports', discover.value.filters.sports))
const leagueOptions = computed(() => {
  const filters = discover.value.filters
  const leagues =
    selectedSport.value === 'all'
      ? filters.leagues
      : (filters.leaguesBySport?.[selectedSport.value] ?? [])
  return withAllOption('All leagues', leagues)
})
const stateOptions = computed(() => withAllOption('All statuses', discover.value.filters.states))

watch(selectedSport, (sport) => {
  if (sport === 'all') return
  const leaguesForSport = discover.value.filters.leaguesBySport?.[sport] ?? []
  const leagueValues = new Set(leaguesForSport.map((o) => o.value))
  if (selectedLeague.value !== 'all' && !leagueValues.has(selectedLeague.value)) {
    selectedLeague.value = 'all'
  }
})

useSeo({
  title: 'All games',
  description: 'Chronological timeline of all live and upcoming games. Pick a game to start a bet.',
  ogImage: {
    title: 'All games',
    description: 'Chronological timeline of every live and upcoming game.',
    icon: '🗓️',
  },
})

useWebPageSchema({
  name: 'Napkinbets — All games',
  description: 'A chronological list of all live and upcoming games to start friendly bets from.',
})

function formatStartTime(isoString: string): string {
  const d = new Date(isoString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  }).format(d)
}

function eventToTimelineItem(e: NapkinbetsEventCard): GamesTimelineItem {
  const statusLabel = e.state === 'in' ? 'Live' : 'Upcoming'
  return {
    date: formatStartTime(e.startTime),
    title: e.eventTitle,
    description: `${e.leagueLabel} · ${statusLabel}`,
    icon: e.state === 'in' ? 'i-lucide-circle-dot' : 'i-lucide-calendar',
    value: e.id,
    slot: 'game',
  }
}

function getEvent(id: string): NapkinbetsEventCard | undefined {
  return events.value.find((e) => e.id === id)
}

const timelineItems = computed(() => events.value.map(eventToTimelineItem))

function eventDetailHref(id: string): string {
  return `/events/${encodeURIComponent(id)}`
}

function onSelect(_e: Event, item: GamesTimelineItem) {
  if (item.value) navigateTo(`/events/${encodeURIComponent(item.value)}`)
}
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero napkinbets-hero-compact">
      <div class="napkinbets-hero-grid napkinbets-hero-grid-discovery">
        <div class="space-y-2">
          <p class="napkinbets-kicker">Schedule</p>
          <h1 class="napkinbets-section-title">All games</h1>
          <p class="napkinbets-hero-lede">
            Live and upcoming games in order. Click a game to view details and start a bet.
          </p>
          <UButton
            to="/events"
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-lucide-arrow-left"
          >
            Back to events
          </UButton>
        </div>
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
          <p class="napkinbets-section-description">Filters load with the timeline.</p>
        </div>
      </template>
    </ClientOnly>

    <UAlert
      v-if="initialFetch.error.value"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Games failed to load"
      :description="initialFetch.error.value?.message ?? 'Something went wrong.'"
    />

    <div v-else class="space-y-6">
      <div v-if="initialFetch.pending.value && !events.length" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
      </div>

      <UCard v-else-if="timelineItems.length" class="napkinbets-panel games-timeline-card">
        <UTimeline
          :items="timelineItems"
          class="games-timeline w-full max-w-3xl"
          :ui="{
            item: 'games-timeline-item games-timeline-item-surface py-4 px-4 rounded-xl mb-3 last:mb-0',
            separator: 'border-l-2 border-default',
            date: 'text-muted text-sm font-medium',
            title: 'text-default font-semibold',
            description: 'text-muted text-sm',
          }"
          @select="onSelect"
        >
          <template #game-date="{ item }">
            <span class="text-muted text-sm font-medium">{{ item.date }}</span>
          </template>
          <template #game-title="{ item }">
            <ULink
              :to="eventDetailHref(item.value)"
              class="games-timeline-link inline-flex items-center gap-1.5 font-semibold text-default hover:text-primary hover:underline"
              @click.stop
            >
              {{ item.title }}
              <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0" />
            </ULink>
          </template>
          <template #game-description="{ item }">
            <div class="space-y-0.5 text-sm">
              <p class="text-muted">{{ item.description }}</p>
              <p
                v-if="
                  getEvent(item.value) &&
                  (getEvent(item.value)?.venueName || getEvent(item.value)?.broadcast)
                "
                class="games-timeline-extra text-dimmed text-xs"
              >
                <template v-if="getEvent(item.value)?.venueName">
                  <UIcon name="i-lucide-map-pin" class="mr-0.5 inline size-3.5" />
                  {{ getEvent(item.value)?.venueName }}
                </template>
                <template v-if="getEvent(item.value)?.venueName && getEvent(item.value)?.broadcast">
                  <span class="mx-1">·</span>
                </template>
                <template v-if="getEvent(item.value)?.broadcast">
                  <UIcon name="i-lucide-radio" class="mr-0.5 inline size-3.5" />
                  {{ getEvent(item.value)?.broadcast }}
                </template>
              </p>
            </div>
          </template>
        </UTimeline>
      </UCard>

      <UAlert
        v-else-if="!initialFetch.pending.value"
        color="info"
        variant="soft"
        icon="i-lucide-calendar-x"
        title="No games right now"
        description="There are no live or upcoming games. Check back later."
      />

      <div v-if="timelineItems.length && nextCursor" class="flex justify-center pt-4">
        <UButton
          color="neutral"
          variant="soft"
          icon="i-lucide-chevron-down"
          :loading="loadMorePending"
          :disabled="loadMorePending"
          @click="loadMore()"
        >
          Load more
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.games-timeline-card {
  padding: 1.25rem;
}

/* Same surface as event cards (napkinbets-panel) for visual consistency */
.games-timeline-item-surface {
  background: var(--napkinbets-surface);
  border: 1px solid var(--napkinbets-border);
}

.games-timeline :deep([data-slot='indicator']) {
  border: 2px solid var(--napkinbets-border);
  background: var(--napkinbets-surface);
}
</style>
