<script setup lang="ts">
import { useNapkinbetsApi } from '../../services/napkinbets-api'
import type { NapkinbetsEventDetail, NapkinbetsEventOddsMarket } from '../../../types/napkinbets'

const route = useRoute()
const eventId = route.params.id as string
const api = useNapkinbetsApi()

const { data: eventData, execute: refreshEventData } = await useAsyncData(
  `event-detail:${eventId}`,
  () => api.getEventDetail(eventId),
)

const eventDetail = computed<NapkinbetsEventDetail | null>(() => eventData.value?.event ?? null)
const odds = computed(() => eventDetail.value?.odds ?? null)
const moneylineOdds = computed(() => odds.value?.moneyline ?? null)
const secondaryOdds = computed<NapkinbetsEventOddsMarket[]>(() =>
  [odds.value?.spread, odds.value?.total]
    .filter((market): market is NapkinbetsEventOddsMarket => Boolean(market))
    .slice(0, 2),
)
const extraOdds = computed<NapkinbetsEventOddsMarket[]>(() => odds.value?.extraMarkets ?? [])
const volumeLabel = computed(() => {
  const vol = odds.value?.volume
  if (!vol || vol <= 0) return null
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`
  return `$${vol}`
})
const priceChangeInfo = computed(() => {
  const change = odds.value?.priceChange24h
  if (change === null || change === undefined || Math.abs(change) < 2) return null
  return {
    label: `${change > 0 ? '+' : ''}${change}pp`,
    icon: change > 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down',
    color: change > 0 ? 'text-success' : 'text-error',
  }
})

// If server says 'pre' but start time has passed, locally infer 'in'
const effectiveState = computed(() => {
  const state = eventDetail.value?.state
  if (state === 'pre' && eventDetail.value?.startTime) {
    const startMs = new Date(eventDetail.value.startTime).getTime()
    if (!Number.isNaN(startMs) && Date.now() >= startMs) {
      return 'in'
    }
  }
  return state
})

const statusLabel = computed(() => {
  if (effectiveState.value === 'in') return 'Live'
  if (effectiveState.value === 'post') return 'Final'
  return 'Upcoming'
})

const statusColor = computed(() => {
  if (effectiveState.value === 'in') return 'success'
  if (effectiveState.value === 'post') return 'neutral'
  return 'warning'
})

function formatProbability(value: number | null) {
  return value === null ? '—' : `${value}%`
}

const isRefreshingOdds = ref(false)
const toast = useToast()

async function refreshOddsData() {
  if (isRefreshingOdds.value) return
  isRefreshingOdds.value = true

  try {
    await api.refreshEventOdds(eventId)
    await refreshEventData() // refresh the async data
    toast.add({
      title: 'Odds refreshed',
      icon: 'i-lucide-check-circle',
      color: 'success',
    })
  } catch (error) {
    toast.add({
      title: 'Failed to refresh odds',
      description: error instanceof Error ? error.message : 'Unknown error',
      icon: 'i-lucide-x-circle',
      color: 'error',
    })
  } finally {
    isRefreshingOdds.value = false
  }
}

useSeo({
  title: eventDetail.value?.eventTitle ?? 'Event details',
  description: eventDetail.value?.summary ?? 'View event details, odds, and start a bet.',
  ogImage: {
    title: eventDetail.value?.eventTitle ?? 'Event details',
    description: eventDetail.value?.summary ?? 'View event details, odds, and start a bet.',
    icon: effectiveState.value === 'in' ? '🔴' : effectiveState.value === 'post' ? '🏁' : '⚡',
    tag: [
      eventDetail.value?.leagueLabel || eventDetail.value?.sportLabel || 'Sports',
      statusLabel.value,
    ].join(' · '),
    // eslint-disable-next-line narduk/no-inline-hex -- OG image tag color based on event state
    tagColor:
      effectiveState.value === 'in'
        ? '#22c55e'
        : effectiveState.value === 'post'
          ? '#64748b'
          : '#3b82f6',
  },
})

useWebPageSchema({
  name: eventDetail.value?.eventTitle ?? 'Event Details',
  description: eventDetail.value?.summary ?? 'Event details with odds and betting context.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div
      v-if="!eventDetail"
      class="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-12"
    >
      <UAlert
        color="error"
        variant="outline"
        icon="i-lucide-circle-alert"
        title="Event not found"
        description="This event may have expired or been removed."
        :ui="{ description: 'text-sm text-error mt-1' }"
        class="w-full max-w-md"
      />
      <UButton to="/events" color="neutral" variant="soft" icon="i-lucide-arrow-left">
        Back to events
      </UButton>
    </div>

    <template v-else>
      <div class="napkinbets-hero napkinbets-hero-compact">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <UButton
              to="/events"
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-arrow-left"
            >
              Events
            </UButton>
            <UBadge :color="statusColor" variant="soft">{{ statusLabel }}</UBadge>
            <UBadge color="neutral" variant="subtle">
              <ULink
                v-if="eventDetail.leagueProfileKey"
                :to="`/leagues/${eventDetail.leagueProfileKey}`"
                class="text-inherit"
              >
                {{ eventDetail.leagueLabel }}
              </ULink>
              <template v-else>
                {{ eventDetail.leagueLabel }}
              </template>
            </UBadge>
          </div>
          <h1 class="napkinbets-section-title">{{ eventDetail.eventTitle }}</h1>
          <div class="napkinbets-event-meta">
            <span>{{ eventDetail.shortStatus || eventDetail.status }}</span>
            <span v-if="eventDetail.broadcast">{{ eventDetail.broadcast }}</span>
          </div>
          <p class="napkinbets-hero-lede">
            <ULink
              v-if="eventDetail.venueProfileSlug"
              :to="`/venues/${eventDetail.venueProfileSlug}`"
              class="text-inherit"
            >
              {{ eventDetail.venueName }}
            </ULink>
            <template v-else>
              {{ eventDetail.venueName }}
            </template>
          </p>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <NapkinbetsBoxScore
          :state="eventDetail.state"
          :status="eventDetail.shortStatus || eventDetail.status"
          :start-time="eventDetail.startTime"
          :venue-name="eventDetail.venueName"
          :venue-location="eventDetail.venueLocation"
          :broadcast="eventDetail.broadcast"
          :sport="eventDetail.sport"
          :league-label="eventDetail.leagueLabel"
          :weather="null"
          :away-team-name="eventDetail.awayTeam.name"
          :away-team-short-name="eventDetail.awayTeam.shortName"
          :away-team-abbreviation="eventDetail.awayTeam.abbreviation"
          :away-team-logo="eventDetail.awayTeam.logo"
          :away-score="eventDetail.awayTeam.score"
          :away-team-record="eventDetail.awayTeam.record"
          :away-team-profile-slug="eventDetail.awayTeamProfileSlug"
          :home-team-name="eventDetail.homeTeam.name"
          :home-team-short-name="eventDetail.homeTeam.shortName"
          :home-team-abbreviation="eventDetail.homeTeam.abbreviation"
          :home-team-logo="eventDetail.homeTeam.logo"
          :home-score="eventDetail.homeTeam.score"
          :home-team-record="eventDetail.homeTeam.record"
          :home-team-profile-slug="eventDetail.homeTeamProfileSlug"
          :linescores="eventDetail.linescores"
          :leaders="eventDetail.leaders"
        />

        <div class="space-y-4">
          <UCard v-if="moneylineOdds" class="napkinbets-panel">
            <div class="space-y-4">
              <div class="flex items-end justify-between gap-3">
                <div class="space-y-2">
                  <p class="napkinbets-kicker">Market odds</p>
                  <h2 class="napkinbets-subsection-title">Polymarket prediction markets</h2>
                </div>
                <UButton
                  v-if="odds?.url"
                  :to="odds.url"
                  target="_blank"
                  external
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="i-lucide-external-link"
                >
                  Source
                </UButton>
              </div>

              <div class="space-y-3">
                <div class="napkinbets-event-odds-block">
                  <span class="napkinbets-event-odds-label">{{ moneylineOdds.label }}</span>
                  <div class="napkinbets-event-odds-grid">
                    <div class="napkinbets-event-odds-pill">
                      <span>{{ moneylineOdds.left.label }}</span>
                      <strong>{{ formatProbability(moneylineOdds.left.probability) }}</strong>
                    </div>
                    <div class="napkinbets-event-odds-pill">
                      <span>{{ moneylineOdds.right.label }}</span>
                      <strong>{{ formatProbability(moneylineOdds.right.probability) }}</strong>
                    </div>
                  </div>
                </div>

                <div v-if="secondaryOdds.length" class="napkinbets-event-odds-secondary">
                  <div
                    v-for="market in secondaryOdds"
                    :key="`${market.label}-${market.detail ?? 'none'}`"
                    class="napkinbets-event-odds-chip"
                  >
                    <span>
                      {{ market.label
                      }}<template v-if="market.detail"> · {{ market.detail }}</template>
                    </span>
                    <strong>
                      {{ market.left.label }} {{ formatProbability(market.left.probability) }} /
                      {{ market.right.label }} {{ formatProbability(market.right.probability) }}
                    </strong>
                  </div>
                </div>

                <div v-if="extraOdds.length" class="napkinbets-event-odds-secondary">
                  <div
                    v-for="market in extraOdds"
                    :key="`extra-${market.label}-${market.detail ?? 'none'}`"
                    class="napkinbets-event-odds-chip"
                  >
                    <span>
                      {{ market.label
                      }}<template v-if="market.detail"> · {{ market.detail }}</template>
                    </span>
                    <strong>
                      {{ market.left.label }} {{ formatProbability(market.left.probability) }} /
                      {{ market.right.label }} {{ formatProbability(market.right.probability) }}
                    </strong>
                  </div>
                </div>

                <div v-if="volumeLabel || priceChangeInfo" class="napkinbets-event-odds-meta">
                  <span v-if="volumeLabel" class="napkinbets-event-odds-volume">
                    <UIcon name="i-lucide-droplets" class="size-3" />
                    {{ volumeLabel }} traded
                  </span>
                  <span
                    v-if="priceChangeInfo"
                    class="napkinbets-event-odds-trend"
                    :class="priceChangeInfo.color"
                  >
                    <UIcon :name="priceChangeInfo.icon" class="size-3" />
                    {{ priceChangeInfo.label }} 24h
                  </span>
                </div>
              </div>
            </div>
          </UCard>

          <UCard v-else class="napkinbets-panel">
            <div class="space-y-4">
              <div class="space-y-2">
                <p class="napkinbets-kicker">Market odds</p>
                <p class="text-sm text-muted">
                  No prediction market data available for this event.
                </p>
              </div>
              <UButton
                :loading="isRefreshingOdds"
                @click="refreshOddsData"
                color="neutral"
                variant="subtle"
                icon="i-lucide-refresh-cw"
              >
                Check Polymarket
              </UButton>
            </div>
          </UCard>

          <UCard v-if="eventDetail.ideas?.length" class="napkinbets-panel">
            <div class="space-y-3">
              <div class="space-y-2">
                <p class="napkinbets-kicker">Bet ideas</p>
                <h2 class="napkinbets-subsection-title">Start from a template</h2>
              </div>
              <div v-for="idea in eventDetail.ideas" :key="idea.title" class="napkinbets-note-row">
                <div class="space-y-1">
                  <p class="font-semibold text-default">{{ idea.title }}</p>
                  <p class="text-sm text-muted">{{ idea.description }}</p>
                </div>
                <UButton
                  :to="{
                    path: '/napkins/create',
                    query: {
                      createMode: 'event',
                      source: eventDetail.source,
                      eventId: eventDetail.id,
                      eventTitle: eventDetail.eventTitle,
                      eventStartsAt: eventDetail.startTime,
                      eventStatus: eventDetail.status,
                      sport: eventDetail.sport,
                      contextKey: eventDetail.contextKey,
                      league: eventDetail.league,
                      venueName: eventDetail.venueName,
                      format: idea.format,
                      sideOptions: idea.sideOptions.join('\n'),
                    },
                  }"
                  color="primary"
                  variant="soft"
                  size="sm"
                  icon="i-lucide-ticket-plus"
                >
                  Use this
                </UButton>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </div>
</template>
