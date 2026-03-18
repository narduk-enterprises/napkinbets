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

const isFinished = computed(
  () =>
    props.wager.eventState === 'post' ||
    props.wager.status === 'settling' ||
    props.wager.status === 'settled',
)

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

const winnerInfo = computed(() => {
  if (!isFinished.value || props.wager.leaderboard.length === 0) return null

  // Sort leaderboard by score descending
  const sortedLeaderboard = [...props.wager.leaderboard].sort((a, b) => b.score - a.score)
  const topScore = sortedLeaderboard[0]!.score

  // Check if there's a tie for first
  const winners = sortedLeaderboard.filter((row) => row.score === topScore)

  if (winners.length === 1) {
    return {
      isTie: false,
      displayName: winners[0]!.displayName,
      sideLabel: winners[0]!.sideLabel,
    }
  }

  // Find unique sides that won
  const winningSides = new Set(winners.map((w) => w.sideLabel))
  if (winningSides.size === 1) {
    return {
      isTie: false,
      displayName: winners.map((w) => w.displayName).join(' & '),
      sideLabel: winners[0]!.sideLabel,
    }
  }

  return {
    isTie: true,
    displayName: winners.map((w) => w.displayName).join(' & '),
    sideLabel: 'Tie / Push',
  }
})
</script>

<template>
  <div class="space-y-4">
    <NapkinbetsBoxScore
      :state="wager.eventState"
      :status="wager.eventStatus"
      :start-time="wager.eventStartsAt"
      :venue-name="wager.venueName"
      :league-label="wager.league ? wager.league.toUpperCase() : undefined"
      :weather="wager.weather"
      :away-team-name="wager.awayTeamName"
      :away-team-logo="wager.awayTeamLogo"
      :away-score="wager.awayScore"
      :home-team-name="wager.homeTeamName"
      :home-team-logo="wager.homeTeamLogo"
      :home-score="wager.homeScore"
    >
      <template #footer>
        <div class="pt-2 border-t border-dashed border-default">
          <!-- BOTTOM: Pick Distribution -->
          <div v-if="showPickDistribution" class="mb-3">
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
              <div class="absolute inset-y-0 left-1/2 w-px bg-default/50 -translate-x-1/2"></div>
            </div>
          </div>

          <div class="flex justify-center -mb-2 pb-1">
            <UButton
              :to="`/events/${encodeURIComponent(wager.eventId!)}`"
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-arrow-right"
              trailing
            >
              View event details
            </UButton>
          </div>
        </div>
      </template>
    </NapkinbetsBoxScore>

    <!-- COMPLETED STATE: Winner announcement -->
    <UAlert
      v-if="isFinished && wager.pots.length > 0 && winnerInfo && !winnerInfo.isTie"
      color="success"
      variant="soft"
      icon="i-lucide-trophy"
      class="border border-success/20 napkinbets-panel"
    >
      <template #title>
        <span class="text-success">{{ winnerInfo.displayName }} wins!</span>
      </template>
      <template #description>
        <div class="space-y-2 mt-1">
          <p>
            <strong>{{ winnerInfo.displayName }}</strong> won this bet on
            <strong>{{ winnerInfo.sideLabel }}</strong
            >. Use the settlement ledger below to close out the bet.
          </p>
        </div>
      </template>
    </UAlert>

    <!-- COMPLETED STATE: Tie / Push -->
    <UAlert
      v-else-if="isFinished && wager.pots.length > 0 && winnerInfo && winnerInfo.isTie"
      color="warning"
      variant="soft"
      icon="i-lucide-scale"
      class="border border-warning/20 napkinbets-panel"
    >
      <template #title>
        <span class="text-warning">Tie / Push</span>
      </template>
      <template #description>
        <div class="space-y-2 mt-1">
          <p>
            The leaderboard shows a tie between
            <strong>{{ winnerInfo.displayName }}</strong
            >. Settle as a push or use the ledger to split the pot.
          </p>
        </div>
      </template>
    </UAlert>

    <!-- COMPLETED STATE: No leaderboard data -->
    <UAlert
      v-else-if="isFinished && wager.pots.length > 0"
      color="success"
      variant="soft"
      icon="i-lucide-party-popper"
      title="Event Completed!"
      class="border border-success/20 napkinbets-panel"
    >
      <template #description>
        <div class="space-y-2 mt-1">
          <p>
            Ensure all your picks are logged correctly, and record your payments using the manual
            settlement ledger below to close out the bet.
          </p>
        </div>
      </template>
    </UAlert>
  </div>
</template>
