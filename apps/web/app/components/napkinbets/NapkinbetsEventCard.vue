<script setup lang="ts">
import type { NapkinbetsEventCard as NapkinbetsEvent, NapkinbetsEventIdea } from '../../../types/napkinbets'

const props = defineProps<{
  event: NapkinbetsEvent
}>()

function buildCreateLink(idea?: NapkinbetsEventIdea) {
  return {
    path: '/wagers/create',
    query: {
      source: props.event.source,
      eventId: props.event.id,
      eventTitle: props.event.summary,
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

function formatStartTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
</script>

<template>
  <UCard class="napkinbets-panel napkinbets-event-card">
    <div class="space-y-5">
      <div class="flex flex-wrap items-center gap-2">
        <UBadge :color="event.state === 'in' ? 'success' : 'info'" variant="soft">
          {{ event.state === 'in' ? 'In progress' : 'Upcoming' }}
        </UBadge>
        <UBadge color="neutral" variant="subtle">{{ event.leagueLabel }}</UBadge>
        <UBadge v-if="event.broadcast" color="warning" variant="soft">{{ event.broadcast }}</UBadge>
      </div>

      <div class="space-y-4">
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

        <div class="space-y-2">
          <p class="font-semibold text-default">{{ event.shortStatus }}</p>
          <p class="napkinbets-support-copy">{{ event.summary }}</p>
          <div class="napkinbets-meta-row">
            <span>{{ formatStartTime(event.startTime) }}</span>
            <span>{{ event.venueName }}</span>
            <span v-if="event.venueLocation">{{ event.venueLocation }}</span>
          </div>
        </div>
      </div>

      <div v-if="event.leaders.length" class="space-y-2">
        <p class="napkinbets-surface-label">Live leaders</p>
        <div class="napkinbets-chip-grid">
          <div v-for="leader in event.leaders" :key="`${leader.label}-${leader.athlete}`" class="napkinbets-chip-card">
            <span class="font-semibold text-default">{{ leader.label }}</span>
            <span class="text-sm text-muted">{{ leader.athlete }} • {{ leader.value }}</span>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <p class="napkinbets-surface-label">Suggested board angles</p>
        <div class="space-y-3">
          <div
            v-for="idea in event.ideas"
            :key="idea.title"
            class="napkinbets-idea-row"
          >
            <div class="space-y-2">
              <p class="font-semibold text-default">{{ idea.title }}</p>
              <p class="text-sm text-muted">{{ idea.description }}</p>
              <div class="napkinbets-chip-grid">
                <span v-for="option in idea.sideOptions" :key="option" class="napkinbets-choice-chip">
                  {{ option }}
                </span>
              </div>
            </div>

            <UButton
              :to="buildCreateLink(idea)"
              color="primary"
              variant="soft"
              icon="i-lucide-arrow-right"
            >
              Build board
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
