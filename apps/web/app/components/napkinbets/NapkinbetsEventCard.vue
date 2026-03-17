<script setup lang="ts">
import { computed } from 'vue'
import type {
  NapkinbetsCreatePrefillQuery,
  NapkinbetsEventCard as NapkinbetsEvent,
  NapkinbetsEventIdea,
  NapkinbetsEventOddsMarket,
} from '../../../types/napkinbets'

const props = defineProps<{
  event: NapkinbetsEvent
}>()

function buildCreatePrefill(
  event: NapkinbetsEvent,
  idea?: NapkinbetsEventIdea,
): NapkinbetsCreatePrefillQuery {
  const isMatchupEvent = event.awayTeam.homeAway === 'away' && event.homeTeam.homeAway === 'home'

  return {
    source: event.source,
    eventId: event.id,
    eventTitle: event.eventTitle,
    eventStartsAt: event.startTime,
    eventStatus: event.status,
    sport: event.sport,
    contextKey: event.contextKey,
    league: event.league,
    venueName: event.venueName,
    homeTeamName: isMatchupEvent ? event.homeTeam.name : '',
    awayTeamName: isMatchupEvent ? event.awayTeam.name : '',
    format: idea?.format || (event.sport === 'golf' ? 'golf-draft' : 'sports-game'),
    sideOptions: idea?.sideOptions ?? [],
  }
}

function buildCreateLink(prefill: NapkinbetsCreatePrefillQuery) {
  return {
    path: '/napkins/create',
    query: {
      createMode: 'event',
      source: prefill.source,
      eventId: prefill.eventId,
      eventTitle: prefill.eventTitle,
      eventStartsAt: prefill.eventStartsAt,
      eventStatus: prefill.eventStatus,
      sport: prefill.sport,
      contextKey: prefill.contextKey,
      league: prefill.league,
      venueName: prefill.venueName,
      homeTeamName: prefill.homeTeamName,
      awayTeamName: prefill.awayTeamName,
      format: prefill.format,
      sideOptions: prefill.sideOptions.join('\n'),
    },
  }
}

function badgeLabel(team: NapkinbetsEvent['homeTeam']) {
  if (team.record) {
    return team.record
  }

  if (team.homeAway === 'featured') {
    return 'Featured'
  }

  if (team.homeAway === 'field') {
    return 'Field'
  }

  return 'Ready'
}

const cardClass = computed(() => [
  'napkinbets-panel',
  'napkinbets-event-card',
  props.event.sport === 'golf' ? 'napkinbets-event-card-golf' : '',
])
const isMatchupEvent = computed(
  () => props.event.awayTeam.homeAway === 'away' && props.event.homeTeam.homeAway === 'home',
)
const eventTeams = computed(() => [props.event.awayTeam, props.event.homeTeam])
const primaryIdea = computed(() => props.event.ideas[0] ?? null)
const insightRows = computed(() => props.event.leaders.slice(0, 1))
const createLink = computed(() => buildCreateLink(buildCreatePrefill(props.event)))
const timeLabel = computed(() => props.event.shortStatus || props.event.status)
const primaryIdeaLink = computed(() =>
  primaryIdea.value ? buildCreateLink(buildCreatePrefill(props.event, primaryIdea.value)) : null,
)
const statusLabel = computed(() => {
  if (props.event.state === 'in') {
    return 'Live'
  }

  if (props.event.state === 'post') {
    return 'Final'
  }

  return 'Upcoming'
})
const statusColor = computed(() => {
  if (props.event.state === 'in') {
    return 'success'
  }

  if (props.event.state === 'post') {
    return 'neutral'
  }

  return 'warning'
})
const moneylineOdds = computed(() => props.event.odds?.moneyline ?? null)
const secondaryOdds = computed<NapkinbetsEventOddsMarket[]>(() =>
  [props.event.odds?.spread, props.event.odds?.total]
    .filter((market): market is NapkinbetsEventOddsMarket => Boolean(market))
    .slice(0, 2),
)
const extraOdds = computed<NapkinbetsEventOddsMarket[]>(() => {
  const extras = props.event.odds?.extraMarkets ?? []
  return extras.slice(0, 3)
})
const extraOddsOverflow = computed(() => {
  const total = props.event.odds?.extraMarkets?.length ?? 0
  return total > 3 ? total - 3 : 0
})
const volumeLabel = computed(() => {
  const vol = props.event.odds?.volume
  if (!vol || vol <= 0) return null
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`
  return `$${vol}`
})
const priceChangeInfo = computed(() => {
  const change = props.event.odds?.priceChange24h
  if (change === null || change === undefined || Math.abs(change) < 2) return null
  return {
    label: `${change > 0 ? '+' : ''}${change}pp`,
    icon: change > 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down',
    color: change > 0 ? 'text-success' : 'text-error',
  }
})
const showInsights = computed(() => !moneylineOdds.value && insightRows.value.length > 0)

function formatProbability(value: number | null) {
  return value === null ? '—' : `${value}%`
}

function scoreLabel(team: NapkinbetsEvent['homeTeam']) {
  if (props.event.state === 'pre' && (!team.score || team.score === '0')) {
    return '—'
  }

  return team.score || '—'
}
</script>

<template>
  <UCard :class="cardClass">
    <div class="space-y-3">
      <div class="napkinbets-event-card-top">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge :color="statusColor" variant="soft">
            {{ statusLabel }}
          </UBadge>
          <UBadge color="neutral" variant="subtle">{{ event.leagueLabel }}</UBadge>
          <UBadge v-if="event.contextKey === 'tournament'" color="warning" variant="soft">
            Tournament
          </UBadge>
        </div>

        <UButton :to="createLink" color="primary" size="xs" icon="i-lucide-plus"> Bet </UButton>
      </div>

      <div class="space-y-1.5">
        <h3 class="napkinbets-subsection-title napkinbets-event-title">{{ event.eventTitle }}</h3>
        <div class="napkinbets-event-meta">
          <span>{{ timeLabel }}</span>
          <span v-if="event.broadcast">{{ event.broadcast }}</span>
        </div>
        <p class="napkinbets-event-venue">{{ event.venueName }}</p>
      </div>

      <div
        class="napkinbets-event-matchup"
        :class="{ 'napkinbets-event-matchup-tournament': !isMatchupEvent }"
      >
        <div
          v-for="team in eventTeams"
          :key="`${event.id}-${team.name}`"
          class="napkinbets-event-side"
        >
          <div class="napkinbets-event-side-main">
            <span class="napkinbets-event-avatar">
              <img
                v-if="team.logo"
                :src="team.logo"
                :alt="team.name"
                class="napkinbets-event-avatar-image"
              />
              <span v-else>{{ team.abbreviation.slice(0, 2) || team.name.slice(0, 2) }}</span>
            </span>

            <div class="min-w-0">
              <p class="napkinbets-event-name">{{ team.shortName || team.name }}</p>
              <p class="napkinbets-event-record">{{ badgeLabel(team) }}</p>
            </div>
          </div>

          <p class="napkinbets-event-score">{{ scoreLabel(team) }}</p>
        </div>
      </div>

      <div v-if="moneylineOdds" class="napkinbets-event-odds-block">
        <div class="napkinbets-event-odds-topline">
          <span class="napkinbets-event-odds-label">{{ moneylineOdds.label }}</span>
          <UButton
            v-if="event.odds?.url"
            :to="event.odds.url"
            target="_blank"
            external
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-external-link"
          >
            Odds
          </UButton>
        </div>

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

        <div v-if="secondaryOdds.length" class="napkinbets-event-odds-secondary">
          <div
            v-for="market in secondaryOdds"
            :key="`${market.label}-${market.detail ?? 'none'}`"
            class="napkinbets-event-odds-chip"
          >
            <span>
              {{ market.label }}<template v-if="market.detail"> · {{ market.detail }}</template>
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
              {{ market.label }}<template v-if="market.detail"> · {{ market.detail }}</template>
            </span>
            <strong>
              {{ market.left.label }} {{ formatProbability(market.left.probability) }} /
              {{ market.right.label }} {{ formatProbability(market.right.probability) }}
            </strong>
          </div>
          <span v-if="extraOddsOverflow" class="napkinbets-event-odds-overflow">
            +{{ extraOddsOverflow }} more
          </span>
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

      <div v-else-if="showInsights" class="napkinbets-event-insights">
        <div
          v-for="leader in insightRows"
          :key="`${leader.label}-${leader.athlete}`"
          class="napkinbets-event-insight"
        >
          <span>{{ leader.label }}</span>
          <strong>{{ leader.athlete }} · {{ leader.value }}</strong>
        </div>
      </div>

      <div class="napkinbets-event-footer">
        <span v-if="primaryIdea" class="napkinbets-choice-chip">
          {{ primaryIdea.title }}
        </span>

        <div class="napkinbets-event-action-row">
          <UButton
            v-if="primaryIdeaLink"
            :to="primaryIdeaLink"
            color="neutral"
            variant="ghost"
            size="xs"
          >
            Setup
          </UButton>
          <UButton v-else :to="createLink" color="neutral" variant="ghost" size="xs">
            Setup
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
</template>
