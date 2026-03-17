<script setup lang="ts">
import type {
  NapkinbetsEventCard as NapkinbetsEvent,
  NapkinbetsEventIdea,
} from '../../../types/napkinbets'

const props = defineProps<{
  event: NapkinbetsEvent
}>()

function buildCreateLink(idea?: NapkinbetsEventIdea) {
  return {
    path: '/wagers/create',
    query: {
      createMode: 'event',
      source: props.event.source,
      eventId: props.event.id,
      eventTitle: props.event.eventTitle,
      eventStartsAt: props.event.startTime,
      eventStatus: props.event.status,
      sport: props.event.sport,
      league: props.event.league,
      venueName: props.event.venueName,
      homeTeamName: props.event.homeTeam.name,
      awayTeamName: props.event.awayTeam.name,
      format: idea?.format || 'sports-game',
      sideOptions: idea?.sideOptions.join('\n') || '',
    },
  }
}

function formatIsoLabel(value: string) {
  return value.replace('T', ' ').replace('Z', ' UTC').slice(0, 20)
}
</script>

<template>
  <UCard class="napkinbets-panel napkinbets-event-card">
    <div class="space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge :color="event.state === 'in' ? 'success' : 'info'" variant="soft">
              {{ event.state === 'in' ? 'Live' : 'Upcoming' }}
            </UBadge>
            <UBadge color="neutral" variant="subtle">{{ event.leagueLabel }}</UBadge>
            <UBadge v-if="event.broadcast" color="warning" variant="soft">{{ event.broadcast }}</UBadge>
          </div>
          <h3 class="napkinbets-subsection-title">{{ event.eventTitle }}</h3>
          <p class="napkinbets-support-copy">{{ event.shortStatus }}</p>
        </div>

        <UButton
          :to="buildCreateLink()"
          color="primary"
          icon="i-lucide-ticket-plus"
        >
          Create board
        </UButton>
      </div>

      <div class="napkinbets-event-scoreboard">
        <div class="napkinbets-event-team">
          <div class="space-y-1">
            <p class="font-semibold text-default">{{ event.awayTeam.name }}</p>
            <p class="text-sm text-muted">{{ event.awayTeam.record || 'Record pending' }}</p>
          </div>
          <p class="napkinbets-event-score">{{ event.awayTeam.score || '0' }}</p>
        </div>

        <div class="napkinbets-event-team">
          <div class="space-y-1">
            <p class="font-semibold text-default">{{ event.homeTeam.name }}</p>
            <p class="text-sm text-muted">{{ event.homeTeam.record || 'Record pending' }}</p>
          </div>
          <p class="napkinbets-event-score">{{ event.homeTeam.score || '0' }}</p>
        </div>
      </div>

      <div class="napkinbets-meta-row">
        <span>{{ event.venueName }}</span>
        <span v-if="event.venueLocation">{{ event.venueLocation }}</span>
        <span>Starts {{ formatIsoLabel(event.startTime) }}</span>
        <span>Synced {{ formatIsoLabel(event.lastSyncedAt) }}</span>
      </div>

      <div v-if="event.leaders.length" class="space-y-2">
        <p class="napkinbets-surface-label">Live angles</p>
        <div class="napkinbets-chip-grid">
          <div
            v-for="leader in event.leaders"
            :key="`${leader.label}-${leader.athlete}`"
            class="napkinbets-chip-card"
          >
            <span class="font-semibold text-default">{{ leader.label }}</span>
            <span class="text-sm text-muted">{{ leader.athlete }} • {{ leader.value }}</span>
          </div>
        </div>
      </div>

      <div class="space-y-2">
        <p class="napkinbets-surface-label">Suggested markets</p>
        <div class="space-y-2">
          <div
            v-for="idea in event.ideas"
            :key="idea.title"
            class="napkinbets-idea-row"
          >
            <div class="space-y-1">
              <p class="font-semibold text-default">{{ idea.title }}</p>
              <p class="text-sm text-muted">{{ idea.description }}</p>
            </div>

            <UButton
              :to="buildCreateLink(idea)"
              color="neutral"
              variant="soft"
              size="sm"
              icon="i-lucide-arrow-right"
            >
              Use this
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
