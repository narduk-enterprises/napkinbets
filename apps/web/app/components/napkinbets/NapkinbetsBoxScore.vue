<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { NapkinbetsLinescore, NapkinbetsEventLeader } from '../../../types/napkinbets'

const props = defineProps<{
  state: 'pre' | 'in' | 'post' | string
  status: string
  startTime: string | null
  venueName: string | null
  venueLocation?: string | null
  broadcast?: string | null
  sport?: string | null
  leagueLabel?: string | null
  weather: {
    temperatureF: number
    conditions: string
  } | null
  awayTeamName: string
  awayTeamShortName?: string | null
  awayTeamAbbreviation?: string | null
  awayTeamLogo: string | null
  awayScore: string | null
  awayTeamRecord?: string | null
  awayTeamProfileSlug?: string | null
  homeTeamName: string
  homeTeamShortName?: string | null
  homeTeamAbbreviation?: string | null
  homeTeamLogo: string | null
  homeScore: string | null
  homeTeamRecord?: string | null
  homeTeamProfileSlug?: string | null
  linescores?: NapkinbetsLinescore | null
  leaders?: NapkinbetsEventLeader[]
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

// If the server still says 'pre' but the start time has already passed,
// locally infer the game is live so we don't show "Starting soon" forever.
const effectiveState = computed(() => {
  if (props.state === 'pre' && props.startTime) {
    const startMs = new Date(props.startTime).getTime()
    if (!Number.isNaN(startMs) && now.value.getTime() >= startMs) {
      return 'in'
    }
  }
  return props.state
})

const isUpcoming = computed(() => effectiveState.value === 'pre')
const isLive = computed(() => effectiveState.value === 'in')
const isFinished = computed(() => effectiveState.value === 'post')

const countdownString = computed(() => {
  if (!isUpcoming.value || !props.startTime) return ''

  const eventTime = new Date(props.startTime).getTime()
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

const hasLinescores = computed(() => {
  if (!props.linescores) return false
  return props.linescores.away.length > 0 && props.linescores.home.length > 0
})

const showLeaders = computed(() => props.leaders && props.leaders.length > 0 && !isUpcoming.value)

const awayAbbr = computed(
  () =>
    props.awayTeamAbbreviation ||
    props.awayTeamShortName ||
    props.awayTeamName.slice(0, 3).toUpperCase(),
)

const homeAbbr = computed(
  () =>
    props.homeTeamAbbreviation ||
    props.homeTeamShortName ||
    props.homeTeamName.slice(0, 3).toUpperCase(),
)

const awayTotal = computed(() => {
  if (hasLinescores.value && props.linescores) {
    return props.linescores.away.reduce((sum, v) => sum + v, 0)
  }
  return props.awayScore || '0'
})

const homeTotal = computed(() => {
  if (hasLinescores.value && props.linescores) {
    return props.linescores.home.reduce((sum, v) => sum + v, 0)
  }
  return props.homeScore || '0'
})

function _formatLocalTime(isoString: string) {
  try {
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    })
      .format(date)
      .replace(/,\s*/, ' - ')
  } catch {
    return ''
  }
}
</script>

<template>
  <div class="space-y-4">
    <UCard
      class="napkinbets-panel napkinbets-boxscore bg-linear-to-br from-default to-muted border-default overflow-hidden"
    >
      <!-- ─── STATUS BAR ──────────────────────────────────── -->
      <div class="napkinbets-boxscore-status-bar">
        <div class="flex items-center gap-2">
          <UBadge :color="badgeColor" variant="soft" class="font-bold">
            {{ badgeLabel }}
          </UBadge>
          <span v-if="isUpcoming" class="text-sm font-medium text-warning tabular-nums">
            {{ countdownString }}
          </span>
          <span v-else class="text-sm font-medium text-muted">
            {{ status }}
          </span>
        </div>

        <div class="flex items-center gap-2 text-xs text-dimmed">
          <span v-if="leagueLabel">{{ leagueLabel }}</span>
        </div>
      </div>

      <!-- ─── TEAM HEADER ─────────────────────────────────── -->
      <div class="napkinbets-boxscore-teams">
        <!-- Away Team -->
        <div class="napkinbets-boxscore-team">
          <span class="napkinbets-boxscore-team-logo">
            <img
              v-if="awayTeamLogo"
              :src="awayTeamLogo"
              :alt="awayTeamName"
              class="napkinbets-event-avatar-image object-contain p-0.5"
            />
            <span v-else class="text-xs font-bold">{{ awayAbbr }}</span>
          </span>
          <div class="min-w-0">
            <p class="napkinbets-boxscore-team-name">
              <ULink
                v-if="awayTeamProfileSlug"
                :to="`/teams/${awayTeamProfileSlug}`"
                class="text-inherit hover:underline"
              >
                {{ awayTeamName }}
              </ULink>
              <template v-else>
                {{ awayTeamName }}
              </template>
            </p>
            <p v-if="awayTeamRecord" class="napkinbets-boxscore-team-record">
              {{ awayTeamRecord }}
            </p>
          </div>
        </div>

        <!-- Score Center -->
        <div class="napkinbets-boxscore-score-center">
          <template v-if="!isUpcoming">
            <span
              class="napkinbets-boxscore-score"
              :class="{ 'opacity-40': isFinished && Number(awayScore) < Number(homeScore) }"
              >{{ awayTotal }}</span
            >
            <span class="text-dimmed text-sm">–</span>
            <span
              class="napkinbets-boxscore-score"
              :class="{ 'opacity-40': isFinished && Number(homeScore) < Number(awayScore) }"
              >{{ homeTotal }}</span
            >
          </template>
          <span v-else class="font-display text-xl font-bold text-dimmed">VS</span>
        </div>

        <!-- Home Team -->
        <div class="napkinbets-boxscore-team napkinbets-boxscore-team-home">
          <div class="min-w-0 text-right">
            <p class="napkinbets-boxscore-team-name">
              <ULink
                v-if="homeTeamProfileSlug"
                :to="`/teams/${homeTeamProfileSlug}`"
                class="text-inherit hover:underline"
              >
                {{ homeTeamName }}
              </ULink>
              <template v-else>
                {{ homeTeamName }}
              </template>
            </p>
            <p v-if="homeTeamRecord" class="napkinbets-boxscore-team-record">
              {{ homeTeamRecord }}
            </p>
          </div>
          <span class="napkinbets-boxscore-team-logo">
            <img
              v-if="homeTeamLogo"
              :src="homeTeamLogo"
              :alt="homeTeamName"
              class="napkinbets-event-avatar-image object-contain p-0.5"
            />
            <span v-else class="text-xs font-bold">{{ homeAbbr }}</span>
          </span>
        </div>
      </div>

      <!-- ─── LINESCORE GRID ──────────────────────────────── -->
      <div v-if="hasLinescores && linescores" class="napkinbets-boxscore-linescore-wrap">
        <div class="napkinbets-boxscore-linescore">
          <!-- Header row -->
          <div class="napkinbets-boxscore-ls-row napkinbets-boxscore-ls-header">
            <span class="napkinbets-boxscore-ls-team-cell"></span>
            <span
              v-for="label in linescores.periodLabels"
              :key="`h-${label}`"
              class="napkinbets-boxscore-ls-cell"
              >{{ label }}</span
            >
            <span class="napkinbets-boxscore-ls-cell napkinbets-boxscore-ls-total">T</span>
          </div>

          <!-- Away row -->
          <div class="napkinbets-boxscore-ls-row">
            <span class="napkinbets-boxscore-ls-team-cell">
              <img
                v-if="awayTeamLogo"
                :src="awayTeamLogo"
                :alt="awayAbbr"
                class="size-4 object-contain"
              />
              <span class="napkinbets-boxscore-ls-abbr">{{ awayAbbr }}</span>
            </span>
            <span
              v-for="(score, i) in linescores.away"
              :key="`a-${i}`"
              class="napkinbets-boxscore-ls-cell"
              >{{ score }}</span
            >
            <span class="napkinbets-boxscore-ls-cell napkinbets-boxscore-ls-total">{{
              awayTotal
            }}</span>
          </div>

          <!-- Home row -->
          <div class="napkinbets-boxscore-ls-row">
            <span class="napkinbets-boxscore-ls-team-cell">
              <img
                v-if="homeTeamLogo"
                :src="homeTeamLogo"
                :alt="homeAbbr"
                class="size-4 object-contain"
              />
              <span class="napkinbets-boxscore-ls-abbr">{{ homeAbbr }}</span>
            </span>
            <span
              v-for="(score, i) in linescores.home"
              :key="`h-${i}`"
              class="napkinbets-boxscore-ls-cell"
              >{{ score }}</span
            >
            <span class="napkinbets-boxscore-ls-cell napkinbets-boxscore-ls-total">{{
              homeTotal
            }}</span>
          </div>
        </div>
      </div>

      <!-- ─── INFO BAR ────────────────────────────────────── -->
      <div class="napkinbets-boxscore-info-bar">
        <span v-if="venueName" class="napkinbets-boxscore-info-item">
          <UIcon name="i-lucide-map-pin" class="size-3" />
          {{ venueName }}
        </span>
        <span v-if="weather" class="napkinbets-boxscore-info-item">
          <UIcon name="i-lucide-thermometer" class="size-3" />
          {{ weather.temperatureF }}° {{ weather.conditions }}
        </span>
        <span v-if="broadcast" class="napkinbets-boxscore-info-item">
          <UIcon name="i-lucide-tv" class="size-3" />
          {{ broadcast }}
        </span>
      </div>

      <!-- ─── GAME LEADERS ────────────────────────────────── -->
      <div v-if="showLeaders" class="napkinbets-boxscore-leaders">
        <h4 class="napkinbets-boxscore-leaders-title">
          {{ effectiveState === 'pre' ? 'Season Leaders' : 'Game Leaders' }}
        </h4>
        <div class="napkinbets-boxscore-leaders-grid">
          <div
            v-for="leader in leaders"
            :key="`${leader.label}-${leader.athlete}`"
            class="napkinbets-boxscore-leader-card"
          >
            <span class="napkinbets-boxscore-leader-label">{{ leader.label }}</span>
            <strong class="napkinbets-boxscore-leader-value">{{ leader.athlete }}</strong>
            <span class="napkinbets-boxscore-leader-stat">{{ leader.value }}</span>
          </div>
        </div>
      </div>

      <slot name="footer"></slot>
    </UCard>
  </div>
</template>
