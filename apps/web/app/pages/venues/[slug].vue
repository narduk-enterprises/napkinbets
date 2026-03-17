<script setup lang="ts">
import { useNapkinbetsApi } from '../../services/napkinbets-api'
import type { NapkinbetsVenueProfileResponse } from '../../../types/napkinbets'

const route = useRoute()
const slug = String(route.params.slug || '')
const api = useNapkinbetsApi()

const { data } = await useAsyncData<NapkinbetsVenueProfileResponse>(
  `napkinbets-venue:${slug}`,
  () => api.getVenueProfile(slug),
)

const profile = computed(() => data.value)

useSeo({
  title: profile.value?.venue.name ?? 'Venue',
  description:
    profile.value?.venue.city || 'Venue profile with linked teams and recent event scores.',
  ogImage: {
    title: profile.value?.venue.name ?? 'Venue',
    description: 'Venue profile with linked teams and recent event scores.',
    icon: '🏟️',
  },
})

useWebPageSchema({
  name: profile.value?.venue.name ?? 'Venue',
  description: 'Venue profile with linked teams and recent event scores.',
})
</script>

<template>
  <div class="napkinbets-page">
    <UAlert
      v-if="!profile"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Venue not found"
      description="This venue profile is not available."
    />

    <template v-else>
      <div class="napkinbets-hero napkinbets-hero-compact">
        <div class="space-y-2">
          <p class="napkinbets-kicker">Venue</p>
          <h1 class="napkinbets-section-title">{{ profile.venue.name }}</h1>
          <p class="napkinbets-hero-lede">
            {{
              [profile.venue.city, profile.venue.stateRegion, profile.venue.country]
                .filter(Boolean)
                .join(', ')
            }}
          </p>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <UCard class="napkinbets-panel">
          <div class="space-y-3">
            <p class="napkinbets-kicker">Home teams</p>
            <div class="space-y-2">
              <ULink
                v-for="team in profile.teams"
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
                <p class="font-semibold text-default">{{ team.name }}</p>
              </ULink>
            </div>
          </div>
        </UCard>

        <UCard class="napkinbets-panel">
          <div class="space-y-3">
            <p class="napkinbets-kicker">Recent events</p>
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
                <p class="text-xs text-dimmed">{{ event.status }}</p>
              </ULink>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </div>
</template>
