<script setup lang="ts">
const { isAuthenticated } = useNapkinbetsNavLinks()
const discoverState = await useNapkinbetsDiscover()
const dashboardState = isAuthenticated.value ? await useNapkinbetsDashboard() : null

const discover = computed(() => discoverState.data.value)
const dashboard = computed(() => dashboardState?.data.value ?? null)
const featuredWagers = computed(() => dashboard.value?.wagers.slice(0, 2) ?? [])
const featuredSpotlight = computed(() => discover.value.spotlights[0] ?? null)
const openingEvents = computed(() =>
  discover.value.sections
    .flatMap((section) => section.events)
    .slice(0, isAuthenticated.value ? 4 : 3),
)

useSeo({
  title: 'Social sports pools for games, props, and drafts',
  description:
    'Napkinbets turns live games, props, and drafts into clean social pools with manual payment follow-up.',
  image: '/brand/og/home.webp',
})

useWebPageSchema({
  name: 'Napkinbets',
  description:
    'A social sports pool app for live games, props, golf drafts, and watch-party side bets.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="napkinbets-hero-grid">
        <div class="space-y-5">
          <div class="space-y-3">
            <p class="napkinbets-kicker">Napkinbets</p>
            <h1 class="napkinbets-hero-title">
              {{
                isAuthenticated
                  ? 'Run tonight’s pools without running the group chat.'
                  : 'Put the side bet where everyone can see it.'
              }}
            </h1>
            <p class="napkinbets-hero-lede">
              {{
                isAuthenticated
                  ? 'Start from a real game, keep the rules short, track the picks, and settle up after the final.'
                  : 'Real games in, simple pool out. Fewer texts, clearer picks, and easy settle-up after the final.'
              }}
            </p>
          </div>

          <div class="napkinbets-hero-actions">
            <UButton to="/events" size="xl" color="primary" icon="i-lucide-radar">
              Browse games
            </UButton>
            <UButton
              :to="isAuthenticated ? '/napkins/create' : '/register'"
              size="xl"
              color="neutral"
              variant="soft"
              icon="i-lucide-ticket-plus"
            >
              {{ isAuthenticated ? 'Start a pool' : 'Create account' }}
            </UButton>
            <UButton
              v-if="!isAuthenticated"
              to="/tour"
              size="xl"
              color="neutral"
              variant="ghost"
              icon="i-lucide-panels-top-left"
            >
              See how it works
            </UButton>
          </div>

          <div class="napkinbets-hero-pills">
            <span class="napkinbets-hero-pill">Real games</span>
            <span class="napkinbets-hero-pill">Pay off-platform</span>
            <span class="napkinbets-hero-pill">Picks and settle up</span>
          </div>
        </div>

        <div class="napkinbets-hero-stack">
          <div v-if="isAuthenticated && dashboard" class="napkinbets-aside-note">
            <p class="napkinbets-kicker">My pools</p>
            <p class="napkinbets-surface-value">{{ dashboard.metrics[0]?.value || '0' }}</p>
            <p class="napkinbets-support-copy">Hosted, joined, and still in motion.</p>
          </div>

          <div v-else class="napkinbets-aside-note">
            <p class="napkinbets-kicker">What it does</p>
            <p class="napkinbets-support-copy">
              Start from a game, invite the room, track picks, and settle after the result is
              official.
            </p>
          </div>

          <NapkinbetsSpotlightCard v-if="featuredSpotlight" :spotlight="featuredSpotlight" />
        </div>
      </div>
    </div>

    <UAlert
      v-if="discoverState.error.value"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Home feed failed to load"
      :description="discoverState.error.value?.message || 'Please refresh and try again.'"
    />

    <div v-if="openingEvents.length" class="napkinbets-section-stack">
      <div class="flex items-end justify-between gap-3">
        <div class="space-y-1">
          <p class="napkinbets-kicker">{{ isAuthenticated ? 'On deck' : 'Tonight' }}</p>
          <h2 class="napkinbets-section-title">
            {{ isAuthenticated ? 'Live and upcoming games' : 'A few good places to start' }}
          </h2>
        </div>
        <UButton to="/events" color="neutral" variant="ghost">
          {{ isAuthenticated ? 'All games' : 'More games' }}
        </UButton>
      </div>

      <div class="napkinbets-scroll-strip">
        <NapkinbetsEventCard v-for="event in openingEvents" :key="event.id" :event="event" />
      </div>
    </div>

    <div v-if="isAuthenticated" class="napkinbets-section-stack">
      <div class="flex items-end justify-between gap-3">
        <div class="space-y-1">
          <p class="napkinbets-kicker">Open pools</p>
          <h2 class="napkinbets-section-title">Pools already in motion</h2>
        </div>
        <UButton to="/dashboard" color="primary" variant="soft" icon="i-lucide-layout-dashboard">
          My pools
        </UButton>
      </div>

      <div v-if="featuredWagers.length" class="grid gap-4 xl:grid-cols-2">
        <NapkinbetsNapkinSummaryCard
          v-for="wager in featuredWagers"
          :key="wager.id"
          title="Live pool"
          description="Players, picks, reminders, and payment follow-up stay in one place."
          :wager="wager"
        />
      </div>

      <UAlert
        v-else
        color="info"
        variant="soft"
        icon="i-lucide-ticket"
        title="No pools yet"
        description="Start from events or spin up a quick custom pool for tonight."
      />
    </div>
  </div>
</template>
