<script setup lang="ts">
import { computed } from 'vue'
import type {
  NapkinbetsCreatePrefillQuery,
  NapkinbetsEventCard as NapkinbetsEvent,
} from '../../../types/napkinbets'
import { useNow } from '@vueuse/core'

const props = defineProps<{
  event: NapkinbetsEvent
  countdown?: boolean
}>()

// If server still says 'pre' but start time has passed, locally infer 'in'
const effectiveState = computed(() => {
  if (props.event.state === 'pre' && props.event.startTime) {
    const startMs = new Date(props.event.startTime).getTime()
    if (!Number.isNaN(startMs) && Date.now() >= startMs) {
      return 'in'
    }
  }
  return props.event.state
})

function buildCreatePrefill(event: NapkinbetsEvent): NapkinbetsCreatePrefillQuery {
  const isMatchup = event.awayTeam.homeAway === 'away' && event.homeTeam.homeAway === 'home'

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
    homeTeamName: isMatchup ? event.homeTeam.name : '',
    awayTeamName: isMatchup ? event.awayTeam.name : '',
    format: event.sport === 'golf' ? 'golf-draft' : 'sports-game',
    sideOptions: [],
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
  if (team.record) return team.record
  if (team.homeAway === 'featured') return 'Featured'
  if (team.homeAway === 'field') return 'Field'
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
const insightRows = computed(() => props.event.leaders.slice(0, 1))
const createLink = computed(() => buildCreateLink(buildCreatePrefill(props.event)))
const timeLabel = computed(() => props.event.shortStatus || props.event.status)
const eventDetailLink = computed(() => `/events/${encodeURIComponent(props.event.id)}`)
const hasOdds = computed(() => Boolean(props.event.odds?.moneyline))
const showInsights = computed(() => !hasOdds.value && insightRows.value.length > 0)
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

function scoreLabel(team: NapkinbetsEvent['homeTeam']) {
  if (effectiveState.value === 'pre' && (!team.score || team.score === '0')) return '—'
  return team.score || '—'
}

function formatLocalTime(isoString: string) {
  try {
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    })
      .format(date)
      .replace(/,\s*/, ' - ')
  } catch {
    return ''
  }
}

const realtimeNow = useNow({ interval: 1000 })

const countdownText = computed(() => {
  if (!props.event.startTime) return ''
  const diffMs = new Date(props.event.startTime).getTime() - realtimeNow.value.getTime()

  if (diffMs <= 0) return 'Starting...'

  const h = Math.floor(diffMs / 3600000)
  const m = Math.floor((diffMs % 3600000) / 60000)
  const s = Math.floor((diffMs % 60000) / 1000)

  if (h > 0) return `${h}h ${m}m`
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})
</script>

<template>
  <UCard :class="cardClass">
    <div class="space-y-2.5">
      <!-- Row 1: Title -->
      <div>
        <h3 class="font-semibold text-default text-base leading-tight">
          <ULink :to="eventDetailLink" class="text-inherit hover:underline">
            {{ event.eventTitle }}
          </ULink>
        </h3>
      </div>

      <!-- Row 2: Status + time -->
      <div class="flex flex-col items-start gap-1.5">
        <p class="text-xs text-muted">
          <template v-if="effectiveState === 'pre' && event.startTime">
            <ClientOnly fallback-tag="span">
              <template #fallback>
                {{ timeLabel }}
              </template>
              {{ formatLocalTime(event.startTime) || timeLabel }}
            </ClientOnly>
          </template>
          <template v-else>
            {{ timeLabel }}
          </template>
        </p>

        <ClientOnly v-if="countdown && effectiveState === 'pre'">
          <UBadge color="warning" variant="subtle" class="font-mono tabular-nums tracking-tight">
            {{ countdownText }}
          </UBadge>
          <template #fallback>
            <UBadge color="warning" variant="subtle" class="font-mono tabular-nums tracking-tight">
              —:—
            </UBadge>
          </template>
        </ClientOnly>
        <UBadge v-else :color="statusColor" variant="soft">{{ statusLabel }}</UBadge>
      </div>

      <!-- Row 3: Teams / Matchup -->
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

      <!-- Row 4: League + sport badge -->
      <div v-if="event.leagueLabel || event.sportLabel" class="napkinbets-event-badges">
        <UBadge v-if="event.sportLabel" color="neutral" variant="soft" size="xs">
          {{ event.sportLabel }}
        </UBadge>
        <UBadge v-if="event.leagueLabel" color="neutral" variant="outline" size="xs">
          {{ event.leagueLabel }}
        </UBadge>
      </div>

      <!-- Row 5: Secondary meta (venue, broadcast) -->
      <div
        v-if="event.venueName || event.venueLocation || event.broadcast"
        class="napkinbets-event-meta"
      >
        <span v-if="event.venueName || event.venueLocation" class="napkinbets-event-venue">
          <UIcon name="i-lucide-map-pin" class="size-3.5 shrink-0" />
          {{ [event.venueName, event.venueLocation].filter(Boolean).join(', ') }}
        </span>
        <span v-if="event.broadcast">
          <UIcon name="i-lucide-radio" class="size-3.5 shrink-0" />
          {{ event.broadcast }}
        </span>
      </div>

      <!-- Row 6: Insights (only if no odds) -->
      <div v-if="showInsights" class="napkinbets-event-insights">
        <div
          v-for="leader in insightRows"
          :key="`${leader.label}-${leader.athlete}`"
          class="napkinbets-event-insight"
        >
          <span>{{ leader.label }}</span>
          <strong>{{ leader.athlete }} · {{ leader.value }}</strong>
        </div>
      </div>

      <!-- Row 7: Actions -->
      <div class="flex flex-col gap-2 pt-2 mt-auto">
        <UButton :to="createLink" color="primary" size="md" block icon="i-lucide-plus">
          Bet
        </UButton>
        <UButton
          :to="eventDetailLink"
          color="neutral"
          variant="ghost"
          size="sm"
          block
          :icon="hasOdds ? 'i-lucide-bar-chart-3' : 'i-lucide-arrow-right'"
        >
          {{ hasOdds ? 'View odds' : 'View event' }}
        </UButton>
      </div>
    </div>
  </UCard>
</template>
