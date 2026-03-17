<script setup lang="ts">
import { useNapkinbetsApi } from '../../services/napkinbets-api'
import type { NapkinbetsLeagueProfileResponse } from '../../../types/napkinbets'

const route = useRoute()
const key = String(route.params.key || '')
const api = useNapkinbetsApi()

const { data } = await useAsyncData<NapkinbetsLeagueProfileResponse>(
  `napkinbets-league:${key}`,
  () => api.getLeagueProfile(key),
)

const league = computed(() => data.value)

useSeo({
  title: league.value?.league.label ?? 'League',
  description:
    league.value?.recentEvents[0]?.eventTitle ?? 'League profile with teams and recent scores.',
  ogImage: {
    title: league.value?.league.label ?? 'League',
    description: 'League profile with teams and recent event scores.',
    icon: '🏟️',
  },
})

useWebPageSchema({
  name: league.value?.league.label ?? 'League',
  description: 'League profile with teams and recent event scores.',
})
</script>

<template>
  <div class="napkinbets-page">
    <UAlert
      v-if="!league"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="League not found"
      description="This league profile is not available."
    />

    <template v-else>
      <div class="napkinbets-hero napkinbets-hero-compact">
        <div class="space-y-2">
          <p class="napkinbets-kicker">League</p>
          <h1 class="napkinbets-section-title">{{ league.league.label }}</h1>
          <p class="napkinbets-hero-lede">
            {{ league.league.sportLabel || league.league.sportKey }} ·
            {{ league.league.primaryContextLabel || league.league.primaryContextKey }}
          </p>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <UCard class="napkinbets-panel">
          <div class="space-y-3">
            <p class="napkinbets-kicker">Teams</p>
            <div class="space-y-2">
              <ULink
                v-for="team in league.teams"
                :key="team.id"
                :to="`/teams/${team.slug}`"
                class="flex items-center gap-3 rounded-lg bg-elevated px-3 py-2"
              >
                <img
                  v-if="team.logoUrl"
                  :src="team.logoUrl"
                  :alt="team.name"
                  class="size-8 rounded-full"
                />
                <div class="min-w-0">
                  <p class="font-semibold text-default">{{ team.name }}</p>
                  <p class="text-xs text-muted">
                    {{ team.city }}
                    <template v-if="team.abbreviation">· {{ team.abbreviation }}</template>
                  </p>
                </div>
              </ULink>
            </div>
          </div>
        </UCard>

        <UCard class="napkinbets-panel">
          <div class="space-y-3">
            <p class="napkinbets-kicker">Recent scores</p>
            <div class="space-y-2">
              <ULink
                v-for="event in league.recentEvents"
                :key="event.id"
                :to="`/events/${event.id}`"
                class="block rounded-lg bg-elevated px-3 py-3"
              >
                <p class="font-semibold text-default">{{ event.eventTitle }}</p>
                <p class="text-sm text-muted">
                  {{ event.awayTeam.name }} {{ event.awayTeam.score || '—' }} ·
                  {{ event.homeTeam.name }} {{ event.homeTeam.score || '—' }}
                </p>
                <p class="text-xs text-dimmed">{{ event.status }} · {{ event.venueName }}</p>
              </ULink>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </div>
</template>
