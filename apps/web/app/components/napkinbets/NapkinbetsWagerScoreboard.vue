<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { NapkinbetsWager } from '../../../types/napkinbets'

const props = defineProps<{
  wager: NapkinbetsWager
}>()

const now = ref(new Date())
let timer: ReturnType<typeof setInterval>
onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})
onUnmounted(() => {
  clearInterval(timer)
})

// Format the date/time string based on eventStartsAt
const isUpcoming = computed(() => props.wager.eventState === 'pre')
const isLive = computed(() => props.wager.eventState === 'in')
const isFinished = computed(
  () =>
    props.wager.eventState === 'post' ||
    props.wager.status === 'settling' ||
    props.wager.status === 'settled',
)

const countdownString = computed(() => {
  if (!isUpcoming.value || !props.wager.eventStartsAt) return ''

  const eventTime = new Date(props.wager.eventStartsAt).getTime()
  const currentTime = now.value.getTime()
  const diffMs = eventTime - currentTime

  if (diffMs <= 0) return 'Starting soon'

  const totalSeconds = Math.floor(diffMs / 1000)
  const days = Math.floor(totalSeconds / (3600 * 24))
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }

  return `${minutes}m ${seconds}s`
})

const badgeColor = computed(() => {
  if (isLive.value) return 'success'
  if (isFinished.value) return 'neutral'
  return 'warning'
})

const badgeLabel = computed(() => {
  if (isLive.value) return 'Live'
  if (isFinished.value) return 'Final'
  return 'Upcoming'
})

// Calculate Pick Distribution (Home vs Away)
// Only applies if it's an event-backed bet where the choices usually align with the teams
const homeTeamPicksCount = computed(() => {
  return props.wager.picks.filter(
    (p) => p.pickLabel === props.wager.homeTeamName || p.pickValue === props.wager.homeTeamName,
  ).length
})

const awayTeamPicksCount = computed(() => {
  return props.wager.picks.filter(
    (p) => p.pickLabel === props.wager.awayTeamName || p.pickValue === props.wager.awayTeamName,
  ).length
})

const totalTeamPicks = computed(() => homeTeamPicksCount.value + awayTeamPicksCount.value)

const homePickPercentage = computed(() => {
  if (totalTeamPicks.value === 0) return 50
  return Math.round((homeTeamPicksCount.value / totalTeamPicks.value) * 100)
})

const awayPickPercentage = computed(() => {
  if (totalTeamPicks.value === 0) return 50
  return Math.round((awayTeamPicksCount.value / totalTeamPicks.value) * 100)
})

const showPickDistribution = computed(() => {
  return totalTeamPicks.value > 0 && props.wager.homeTeamName && props.wager.awayTeamName
})

const winningSideLabel = computed(() => {
  if (!isFinished.value || props.wager.leaderboard.length === 0) return null

  // Sort leaderboard by score descending
  const sortedLeaderboard = [...props.wager.leaderboard].sort((a, b) => b.score - a.score)
  const topScore = sortedLeaderboard[0]!.score

  // Check if there's a tie for first
  const winners = sortedLeaderboard.filter((row) => row.score === topScore)

  if (winners.length === 1) {
    return winners[0]!.sideLabel
  }

  // Find unique sides that won
  const winningSides = new Set(winners.map((w) => w.sideLabel))
  if (winningSides.size === 1) {
    return winners[0]!.sideLabel
  }

  return 'Tie / Push'
})
</script>

<template>
  <div class="space-y-4">
    <UCard class="napkinbets-panel bg-linear-to-br from-default to-muted border-default">
      <!-- TOP: Status and Weather -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <UBadge :color="badgeColor" variant="soft" class="font-bold">
            {{ badgeLabel }}
          </UBadge>
          <span v-if="isUpcoming" class="text-sm font-medium text-warning tabular-nums">
            {{ countdownString }}
          </span>
          <span v-else class="text-sm font-medium text-muted">
            {{ wager.eventStatus }}
          </span>
        </div>

        <div
          v-if="wager.venueName"
          class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted"
        >
          <span class="flex items-center gap-1">
            <UIcon name="i-lucide-map-pin" class="size-3.5" />
            {{ wager.venueName }}
          </span>
          <span v-if="wager.weather" class="flex items-center gap-1">
            <UIcon name="i-lucide-cloud" class="size-3.5" />
            {{ wager.weather.temperatureF }}° {{ wager.weather.conditions }}
          </span>
        </div>
      </div>

      <!-- MIDDLE: Matchup & Scores -->
      <div class="flex items-center justify-between py-2">
        <!-- Away Team -->
        <div class="flex flex-1 flex-col items-center gap-2 sm:flex-row sm:justify-start">
          <span
            class="napkinbets-event-avatar size-12 sm:size-16 bg-white border border-faint shadow-sm"
          >
            <img
              v-if="wager.awayTeamLogo"
              :src="wager.awayTeamLogo"
              :alt="wager.awayTeamName"
              class="napkinbets-event-avatar-image object-contain p-1"
            />
            <span v-else class="text-lg font-bold">{{
              wager.awayTeamName.slice(0, 2).toUpperCase()
            }}</span>
          </span>
          <div class="text-center sm:text-left">
            <p class="font-display text-lg font-bold leading-tight">{{ wager.awayTeamName }}</p>
            <p class="text-sm text-dimmed">Away</p>
          </div>
        </div>

        <!-- Score / VS -->
        <div class="flex flex-col items-center justify-center px-4">
          <div v-if="!isUpcoming" class="flex items-center gap-3 font-display">
            <span
              class="text-3xl font-bold"
              :class="{
                'opacity-50': isFinished && Number(wager.awayScore) < Number(wager.homeScore),
              }"
              >{{ wager.awayScore || '0' }}</span
            >
            <span class="text-muted font-normal">-</span>
            <span
              class="text-3xl font-bold"
              :class="{
                'opacity-50': isFinished && Number(wager.homeScore) < Number(wager.awayScore),
              }"
              >{{ wager.homeScore || '0' }}</span
            >
          </div>
          <div v-else class="flex flex-col items-center text-center">
            <p class="font-display text-xl font-bold text-muted">VS</p>
          </div>
        </div>

        <!-- Home Team -->
        <div class="flex flex-1 flex-col items-center gap-2 sm:flex-row-reverse sm:justify-start">
          <span
            class="napkinbets-event-avatar size-12 sm:size-16 bg-white border border-faint shadow-sm"
          >
            <img
              v-if="wager.homeTeamLogo"
              :src="wager.homeTeamLogo"
              :alt="wager.homeTeamName"
              class="napkinbets-event-avatar-image object-contain p-1"
            />
            <span v-else class="text-lg font-bold">{{
              wager.homeTeamName.slice(0, 2).toUpperCase()
            }}</span>
          </span>
          <div class="text-center sm:text-right">
            <p class="font-display text-lg font-bold leading-tight">{{ wager.homeTeamName }}</p>
            <p class="text-sm text-dimmed">Home</p>
          </div>
        </div>
      </div>

      <!-- BOTTOM: Pick Distribution -->
      <div v-if="showPickDistribution" class="pt-2 border-t border-dashed border-default">
        <div class="flex items-center justify-between text-xs text-muted mb-1.5 font-medium">
          <span>{{ awayPickPercentage }}% Picked Away</span>
          <span>{{ homePickPercentage }}% Picked Home</span>
        </div>
        <div class="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            class="absolute inset-y-0 left-0 bg-primary/80 transition-all duration-500"
            :style="{ width: `${awayPickPercentage}%` }"
          ></div>
          <div
            class="absolute inset-y-0 right-0 bg-info/80 transition-all duration-500"
            :style="{ width: `${homePickPercentage}%` }"
          ></div>
          <div class="absolute inset-y-0 left-1/2 w-px bg-white/50 -translate-x-1/2"></div>
        </div>
      </div>
    </UCard>

    <!-- COMPLETED STATE NEXT STEPS -->
    <UAlert
      v-if="isFinished && wager.pots.length > 0"
      color="success"
      variant="soft"
      icon="i-lucide-party-popper"
      title="Event Completed!"
      class="border border-success/20 napkinbets-panel"
    >
      <template #description>
        <div class="space-y-2 mt-1">
          <p v-if="winningSideLabel">
            Based on the current leaderboard, the winning side was
            <strong>{{ winningSideLabel }}</strong
            >.
          </p>
          <p>
            Ensure all your picks are logged correctly, and record your payments using the manual
            settlement ledger below to close out the bet.
          </p>
        </div>
      </template>
    </UAlert>
  </div>
</template>
