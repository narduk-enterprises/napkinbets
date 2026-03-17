<script setup lang="ts">
import { useNapkinbetsApi } from '../../services/napkinbets-api'
import type { NapkinbetsEventDetail, NapkinbetsEventOddsMarket } from '../../../types/napkinbets'

const route = useRoute()
const eventId = route.params.id as string
const api = useNapkinbetsApi()

const { data: eventData } = await useAsyncData(`event-detail:${eventId}`, () =>
  api.getEventDetail(eventId),
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

const statusLabel = computed(() => {
  const state = eventDetail.value?.state
  if (state === 'in') return 'Live'
  if (state === 'post') return 'Final'
  return 'Upcoming'
})

const statusColor = computed(() => {
  const state = eventDetail.value?.state
  if (state === 'in') return 'success'
  if (state === 'post') return 'neutral'
  return 'warning'
})

const matchupRows = computed(() => {
  if (!eventDetail.value) {
    return []
  }

  return [
    {
      team: eventDetail.value.awayTeam,
      slug: eventDetail.value.awayTeamProfileSlug ?? null,
    },
    {
      team: eventDetail.value.homeTeam,
      slug: eventDetail.value.homeTeamProfileSlug ?? null,
    },
  ]
})

function formatProbability(value: number | null) {
  return value === null ? '—' : `${value}%`
}

useSeo({
  title: eventDetail.value?.eventTitle ?? 'Event details',
  description: eventDetail.value?.summary ?? 'View event details, odds, and start a bet.',
  image: '/brand/og/discover.webp',
})

useWebPageSchema({
  name: eventDetail.value?.eventTitle ?? 'Event Details',
  description: eventDetail.value?.summary ?? 'Event details with odds and betting context.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div v-if="!eventDetail" class="space-y-4">
      <UAlert
        color="error"
        variant="soft"
        icon="i-lucide-circle-alert"
        title="Event not found"
        description="This event may have expired or been removed."
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
        <UCard class="napkinbets-panel">
          <div class="space-y-4">
            <div class="space-y-2">
              <p class="napkinbets-kicker">Matchup</p>
              <h2 class="napkinbets-subsection-title">{{ eventDetail.summary }}</h2>
            </div>

            <div class="space-y-3">
              <div v-for="row in matchupRows" :key="row.team?.name" class="napkinbets-event-side">
                <div class="napkinbets-event-side-main">
                  <span class="napkinbets-event-avatar">
                    <img
                      v-if="row.team?.logo"
                      :src="row.team.logo"
                      :alt="row.team.name"
                      class="napkinbets-event-avatar-image"
                    />
                    <span v-else>{{
                      (row.team?.abbreviation || row.team?.name || '').slice(0, 2)
                    }}</span>
                  </span>
                  <div class="min-w-0">
                    <p class="napkinbets-event-name">
                      <ULink v-if="row.slug" :to="`/teams/${row.slug}`" class="text-inherit">
                        {{ row.team?.name }}
                      </ULink>
                      <template v-else>
                        {{ row.team?.name }}
                      </template>
                    </p>
                    <p class="napkinbets-event-record">{{ row.team?.record }}</p>
                  </div>
                </div>
                <p class="napkinbets-event-score">{{ row.team?.score || '—' }}</p>
              </div>
            </div>

            <div v-if="eventDetail.leaders?.length" class="napkinbets-event-insights">
              <div
                v-for="leader in eventDetail.leaders"
                :key="`${leader.label}-${leader.athlete}`"
                class="napkinbets-event-insight"
              >
                <span>{{ leader.label }}</span>
                <strong>{{ leader.athlete }} · {{ leader.value }}</strong>
              </div>
            </div>
          </div>
        </UCard>

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
            <div class="space-y-2">
              <p class="napkinbets-kicker">Market odds</p>
              <p class="text-sm text-muted">No prediction market data available for this event.</p>
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
