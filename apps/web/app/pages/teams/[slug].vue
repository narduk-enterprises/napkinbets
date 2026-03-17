<script setup lang="ts">
import { useNapkinbetsApi } from '../../services/napkinbets-api'
import type { NapkinbetsTeamProfileResponse } from '../../../types/napkinbets'

const route = useRoute()
const slug = String(route.params.slug || '')
const api = useNapkinbetsApi()

const { data } = await useAsyncData<NapkinbetsTeamProfileResponse>(`napkinbets-team:${slug}`, () =>
  api.getTeamProfile(slug),
)

const profile = computed(() => data.value)

useSeo({
  title: profile.value?.team.name ?? 'Team',
  description:
    profile.value?.recentEvents[0]?.eventTitle ?? 'Team profile with roster and recent scores.',
  ogImage: {
    title: profile.value?.team.name ?? 'Team',
    description: 'Team profile with roster and recent scores.',
    icon: '🏀',
  },
})

useWebPageSchema({
  name: profile.value?.team.name ?? 'Team',
  description: 'Team profile with roster and recent scores.',
})
</script>

<template>
  <div class="napkinbets-page">
    <UAlert
      v-if="!profile"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Team not found"
      description="This team profile is not available."
    />

    <template v-else>
      <div class="napkinbets-hero napkinbets-hero-compact">
        <div class="space-y-2">
          <p class="napkinbets-kicker">Team</p>
          <h1 class="napkinbets-section-title">{{ profile.team.name }}</h1>
          <p class="napkinbets-hero-lede">
            {{ profile.team.city }}
            <template v-if="profile.team.country">· {{ profile.team.country }}</template>
          </p>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-if="profile.team.primaryLeagueKey"
              :to="`/leagues/${profile.team.primaryLeagueKey}`"
              color="neutral"
              variant="ghost"
              size="xs"
            >
              League
            </UButton>
            <UButton
              v-if="profile.team.venue"
              :to="`/venues/${profile.team.venue.slug}`"
              color="neutral"
              variant="ghost"
              size="xs"
            >
              Venue
            </UButton>
          </div>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <UCard class="napkinbets-panel">
          <div class="space-y-3">
            <p class="napkinbets-kicker">Roster</p>
            <p class="text-sm text-muted">
              <template v-if="profile.rosterSeason">Season {{ profile.rosterSeason }}</template>
              <template v-else>No synced roster yet.</template>
            </p>
            <div class="space-y-2">
              <ULink
                v-for="player in profile.roster"
                :key="player.id"
                :to="`/players/${player.slug}`"
                class="flex items-center gap-3 rounded-lg bg-elevated px-3 py-2"
              >
                <img
                  v-if="player.imageUrl"
                  :src="player.imageUrl"
                  :alt="player.displayName"
                  class="size-8 rounded-full object-cover"
                />
                <div class="min-w-0">
                  <p class="font-semibold text-default">{{ player.displayName }}</p>
                  <p class="text-xs text-muted">
                    {{ player.position || 'Unlisted position' }}
                    <template v-if="player.jerseyNumber">· #{{ player.jerseyNumber }}</template>
                    <template v-if="player.nationality">· {{ player.nationality }}</template>
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
                v-for="event in profile.recentEvents"
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
