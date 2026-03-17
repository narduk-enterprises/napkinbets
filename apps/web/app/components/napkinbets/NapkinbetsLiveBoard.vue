<script setup lang="ts">
import type { NapkinbetsLiveGame, NapkinbetsWeatherSnapshot } from '../../../types/napkinbets'

defineProps<{
  liveGames: NapkinbetsLiveGame[]
  weather: NapkinbetsWeatherSnapshot[]
  refreshedAt: string
}>()

function formatRefresh(value: string) {
  if (!value) {
    return 'Updating now'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function weatherHigh(value: NapkinbetsWeatherSnapshot) {
  return Math.round(value.highF ?? value.temperatureF)
}

function weatherLow(value: NapkinbetsWeatherSnapshot) {
  return Math.round(value.lowF ?? value.temperatureF)
}

function competitorLabel(value: string) {
  if (value === 'home') {
    return 'HOME'
  }

  if (value === 'away') {
    return 'AWAY'
  }

  return value.toUpperCase()
}
</script>

<template>
  <div class="napkinbets-section-stack">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div class="space-y-1">
        <p class="napkinbets-kicker">Live context</p>
        <h2 class="napkinbets-section-title">Live event pulse and weather snapshots</h2>
      </div>
      <p class="napkinbets-support-copy">Refreshed {{ formatRefresh(refreshedAt) }}</p>
    </div>

    <div class="napkinbets-live-grid">
      <UCard class="napkinbets-panel">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="napkinbets-subsection-title">Scoreboard</p>
              <p class="napkinbets-support-copy">Sports context for napkins tied to live action.</p>
            </div>
            <UBadge color="primary" variant="soft" icon="i-lucide-radio-tower"> ESPN </UBadge>
          </div>
        </template>

        <div class="space-y-3">
          <div v-for="game in liveGames" :key="game.id" class="napkinbets-live-game">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="font-semibold text-default">
                  {{ game.shortName }}
                </p>
                <p class="text-sm text-muted">
                  {{ game.status }}
                </p>
              </div>
              <UBadge color="neutral" variant="subtle">
                {{ game.league.toUpperCase() }}
              </UBadge>
            </div>

            <div class="space-y-2">
              <div
                v-for="team in game.competitors"
                :key="`${game.id}-${team.abbreviation}`"
                class="napkinbets-score-row"
              >
                <div class="flex items-center gap-2">
                  <span class="napkinbets-score-side">
                    {{ competitorLabel(team.homeAway) }}
                  </span>
                  <span>{{ team.name }}</span>
                </div>
                <span class="font-semibold text-default">
                  {{ team.score }}
                </span>
              </div>
            </div>
          </div>

          <p v-if="liveGames.length === 0" class="napkinbets-support-copy">
            Add a sport and league to a napkin to see live scoreboard context here.
          </p>
        </div>
      </UCard>

      <UCard class="napkinbets-panel">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="napkinbets-subsection-title">Venue weather</p>
              <p class="napkinbets-support-copy">
                Pulled from Open-Meteo for golf rounds and outdoor pools.
              </p>
            </div>
            <UBadge color="info" variant="soft" icon="i-lucide-cloud-sun"> Forecast </UBadge>
          </div>
        </template>

        <div class="space-y-3">
          <div
            v-for="forecast in weather"
            :key="`${forecast.location}-${forecast.forecastTime}`"
            class="napkinbets-weather-card"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-semibold text-default">
                  {{ forecast.location }}
                </p>
                <p class="text-sm text-muted">
                  {{ forecast.conditions }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-2xl font-display text-default">{{ forecast.temperatureF }}°</p>
                <p class="text-sm text-muted">Feels like {{ forecast.feelsLikeF }}°</p>
              </div>
            </div>

            <div class="napkinbets-meta-row">
              <span>High {{ weatherHigh(forecast) }}°</span>
              <span>Low {{ weatherLow(forecast) }}°</span>
              <span>Wind {{ forecast.windMph }} mph</span>
            </div>
          </div>

          <p v-if="weather.length === 0" class="napkinbets-support-copy">
            Add venue coordinates when a pool depends on outdoor conditions.
          </p>
        </div>
      </UCard>
    </div>
  </div>
</template>
