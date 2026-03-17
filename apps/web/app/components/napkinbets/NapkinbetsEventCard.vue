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
</script>

<template>
  <UCard :class="cardClass">
    <div class="napkinbets-event-card-top">
      <div class="flex flex-wrap items-center gap-2">
        <UBadge :color="event.state === 'in' ? 'success' : 'warning'" variant="soft">
          {{ event.state === 'in' ? 'Live' : 'Upcoming' }}
        </UBadge>
        <UBadge color="neutral" variant="subtle">{{ event.leagueLabel }}</UBadge>
        <UBadge v-if="event.contextKey === 'tournament'" color="warning" variant="soft">
          Tournament
        </UBadge>
      </div>

      <UButton :to="createLink" color="primary" size="sm" icon="i-lucide-plus">
        Start pool
      </UButton>
    </div>

    <div class="space-y-3">
      <div class="space-y-1">
        <h3 class="napkinbets-subsection-title napkinbets-event-title">{{ event.eventTitle }}</h3>
        <div class="napkinbets-event-meta">
          <span>{{ timeLabel }}</span>
          <span v-if="event.broadcast">{{ event.broadcast }}</span>
          <span>{{ event.venueName }}</span>
        </div>
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

          <p class="napkinbets-event-score">{{ team.score || (isMatchupEvent ? '0' : '—') }}</p>
        </div>
      </div>

      <div v-if="insightRows.length" class="napkinbets-event-insights">
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
        <div class="napkinbets-event-action-row">
          <UButton
            v-if="primaryIdea && primaryIdeaLink"
            :to="primaryIdeaLink"
            color="neutral"
            size="sm"
          >
            {{ primaryIdea.title }}
          </UButton>
          <UButton v-else :to="createLink" color="neutral" size="sm">
            Open picks
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
</template>
