<script setup lang="ts">
import { useNapkinbetsApi } from '../../services/napkinbets-api'
import type { NapkinbetsPlayerProfileResponse } from '../../../types/napkinbets'

const route = useRoute()
const slug = String(route.params.slug || '')
const api = useNapkinbetsApi()

const { data } = await useAsyncData<NapkinbetsPlayerProfileResponse>(
  `napkinbets-player:${slug}`,
  () => api.getPlayerProfile(slug),
)

const profile = computed(() => data.value)

useSeo({
  title: profile.value?.player.displayName ?? 'Player',
  description:
    profile.value?.player.position || 'Player profile with roster history and recent team scores.',
  ogImage: {
    title: profile.value?.player.displayName ?? 'Player',
    description: 'Player profile with roster history and recent team scores.',
    icon: '🧢',
  },
})

useWebPageSchema({
  name: profile.value?.player.displayName ?? 'Player',
  description: 'Player profile with roster history and recent team scores.',
})
</script>

<template>
  <div class="napkinbets-page">
    <UAlert
      v-if="!profile"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Player not found"
      description="This player profile is not available."
    />

    <template v-else>
      <div class="napkinbets-hero napkinbets-hero-compact">
        <div class="space-y-2">
          <p class="napkinbets-kicker">Player</p>
          <h1 class="napkinbets-section-title">{{ profile.player.displayName }}</h1>
          <p class="napkinbets-hero-lede">
            {{ profile.player.position || 'Unlisted position' }}
            <template v-if="profile.player.jerseyNumber"
              >· #{{ profile.player.jerseyNumber }}</template
            >
            <template v-if="profile.player.nationality"
              >· {{ profile.player.nationality }}</template
            >
          </p>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <UCard class="napkinbets-panel">
          <div class="space-y-3">
            <p class="napkinbets-kicker">Roster history</p>
            <div class="space-y-2">
              <div
                v-for="entry in profile.rosterHistory"
                :key="`${entry.season}-${entry.team?.id || 'none'}`"
                class="rounded-lg bg-elevated px-3 py-3"
              >
                <p class="font-semibold text-default">{{ entry.season }}</p>
                <p class="text-sm text-muted">
                  <template v-if="entry.team">
                    <ULink :to="`/teams/${entry.team.slug}`">{{ entry.team.name }}</ULink>
                  </template>
                  <template v-else>Unknown team</template>
                  <template v-if="entry.position"> · {{ entry.position }}</template>
                  <template v-if="entry.jerseyNumber"> · #{{ entry.jerseyNumber }}</template>
                  <template v-if="entry.status"> · {{ entry.status }}</template>
                </p>
              </div>
            </div>
          </div>
        </UCard>

        <UCard class="napkinbets-panel">
          <div class="space-y-3">
            <p class="napkinbets-kicker">Recent team scores</p>
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
