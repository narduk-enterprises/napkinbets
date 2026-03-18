<script setup lang="ts">
import { computed } from 'vue'
import type {
  NapkinbetsCreatePrefillQuery,
  NapkinbetsEventCard as NapkinbetsEvent,
  NapkinbetsEventIdea,
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
const hasOdds = computed(() => Boolean(props.event.odds?.moneyline))
const eventDetailLink = computed(() => `/events/${encodeURIComponent(props.event.id)}`)
const showInsights = computed(() => !hasOdds.value && insightRows.value.length > 0)
const lastUpdatedLabel = computed(() => {
  if (props.event.state !== 'in' || !props.event.lastSyncedAt) return null
  const syncMs = Date.parse(props.event.lastSyncedAt)
  if (Number.isNaN(syncMs)) return null
  const diffMs = Date.now() - syncMs
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'Updated just now'
  if (diffMin < 60) return `Updated ${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  return `Updated ${diffHr}h ago`
})

function scoreLabel(team: NapkinbetsEvent['homeTeam']) {
  if (props.event.state === 'pre' && (!team.score || team.score === '0')) {
    return '—'
  }

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
        <h3 class="napkinbets-subsection-title napkinbets-event-title">
          <ULink :to="eventDetailLink" class="text-inherit hover:underline">
            {{ event.eventTitle }}
          </ULink>
        </h3>
        <div class="napkinbets-event-meta">
          <span>
            <template v-if="event.state === 'pre' && event.startTime">
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
          </span>
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

      <div v-if="showInsights" class="pt-2 border-t border-dashed border-default space-y-3">
        <h4 class="text-sm font-semibold text-default px-1">
          {{ event.state === 'pre' ? 'Season Leaders' : 'Game Leaders' }}
        </h4>
        <div class="napkinbets-event-insights">
          <div
            v-for="leader in insightRows"
            :key="`${leader.label}-${leader.athlete}`"
            class="napkinbets-event-insight"
          >
            <span>{{ leader.label }}</span>
            <strong>{{ leader.athlete }} · {{ leader.value }}</strong>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          :to="eventDetailLink"
          color="neutral"
          variant="soft"
          size="xs"
          :icon="hasOdds ? 'i-lucide-bar-chart-3' : 'i-lucide-arrow-right'"
        >
          {{ hasOdds ? 'View odds' : 'View event' }}
        </UButton>
      </div>

      <div class="napkinbets-event-footer">
        <span v-if="primaryIdea" class="napkinbets-choice-chip">
          {{ primaryIdea.title }}
        </span>

        <div class="napkinbets-event-action-row">
          <span v-if="lastUpdatedLabel" class="text-xs text-dimmed">
            <UIcon name="i-lucide-refresh-cw" class="size-3" />
            {{ lastUpdatedLabel }}
          </span>
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
