<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  state: 'pre' | 'in' | 'post' | string
  status: string
  startTime: string | null
  venueName: string | null
  weather: {
    temperatureF: number
    conditions: string
  } | null
  awayTeamName: string
  awayTeamLogo: string | null
  awayScore: string | null
  awayTeamProfileSlug?: string | null
  homeTeamName: string
  homeTeamLogo: string | null
  homeScore: string | null
  homeTeamProfileSlug?: string | null
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

const isUpcoming = computed(() => props.state === 'pre')
const isLive = computed(() => props.state === 'in')
const isFinished = computed(() => props.state === 'post')

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

function formatLocalTime(isoString: string) {
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
            <template v-if="isUpcoming && startTime">
              <ClientOnly fallback-tag="span">
                <template #fallback>
                  {{ status }}
                </template>
                {{ formatLocalTime(startTime) || status }}
              </ClientOnly>
            </template>
            <template v-else>
              {{ status }}
            </template>
          </span>
        </div>

        <div
          v-if="venueName"
          class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted"
        >
          <span class="flex items-center gap-1">
            <UIcon name="i-lucide-map-pin" class="size-3.5" />
            {{ venueName }}
          </span>
          <span v-if="weather" class="flex items-center gap-1">
            <UIcon name="i-lucide-cloud" class="size-3.5" />
            {{ weather.temperatureF }}° {{ weather.conditions }}
          </span>
        </div>
      </div>

      <!-- MIDDLE: Matchup & Scores -->
      <div class="flex items-center justify-between py-2">
        <!-- Away Team -->
        <div class="flex flex-1 flex-col items-center gap-2 sm:flex-row sm:justify-start">
          <span
            class="napkinbets-event-avatar size-12 sm:size-16 bg-white border border-faint shadow-sm shrink-0"
          >
            <img
              v-if="awayTeamLogo"
              :src="awayTeamLogo"
              :alt="awayTeamName"
              class="napkinbets-event-avatar-image object-contain p-1"
            />
            <span v-else class="text-lg font-bold">{{
              awayTeamName.slice(0, 2).toUpperCase()
            }}</span>
          </span>
          <div class="text-center sm:text-left">
            <p class="font-display text-lg font-bold leading-tight">
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
            <p class="text-sm text-dimmed">Away</p>
          </div>
        </div>

        <!-- Score / VS -->
        <div class="flex flex-col items-center justify-center px-4 shrink-0">
          <div v-if="!isUpcoming" class="flex items-center gap-3 font-display">
            <span
              class="text-3xl font-bold"
              :class="{
                'opacity-50': isFinished && Number(awayScore) < Number(homeScore),
              }"
              >{{ awayScore || '0' }}</span
            >
            <span class="text-muted font-normal">-</span>
            <span
              class="text-3xl font-bold"
              :class="{
                'opacity-50': isFinished && Number(homeScore) < Number(awayScore),
              }"
              >{{ homeScore || '0' }}</span
            >
          </div>
          <div v-else class="flex flex-col items-center text-center">
            <p class="font-display text-xl font-bold text-muted">VS</p>
          </div>
        </div>

        <!-- Home Team -->
        <div class="flex flex-1 flex-col items-center gap-2 sm:flex-row-reverse sm:justify-start">
          <span
            class="napkinbets-event-avatar size-12 sm:size-16 bg-white border border-faint shadow-sm shrink-0"
          >
            <img
              v-if="homeTeamLogo"
              :src="homeTeamLogo"
              :alt="homeTeamName"
              class="napkinbets-event-avatar-image object-contain p-1"
            />
            <span v-else class="text-lg font-bold">{{
              homeTeamName.slice(0, 2).toUpperCase()
            }}</span>
          </span>
          <div class="text-center sm:text-right">
            <p class="font-display text-lg font-bold leading-tight">
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
            <p class="text-sm text-dimmed">Home</p>
          </div>
        </div>
      </div>

      <slot name="footer"></slot>
    </UCard>
  </div>
</template>
