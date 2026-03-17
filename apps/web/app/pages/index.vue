<script setup lang="ts">
const [dashboardState, discoverState] = await Promise.all([
  useNapkinbetsDashboard(),
  useNapkinbetsDiscover(),
])
const { isAuthenticated } = useNapkinbetsNavLinks()

const dashboard = computed(() => dashboardState.data.value)
const discover = computed(() => discoverState.data.value)
const featuredWagers = computed(() => dashboard.value.wagers.slice(0, 2))
const featuredSpotlights = computed(() => discover.value.spotlights.slice(0, 2))
const openingEvents = computed(() =>
  discover.value.sections.flatMap((section) => section.events).slice(0, 4),
)

useSeo({
  title: 'Friendly wager boards for sports nights, drafts, and prop bets',
  description:
    'Napkinbets turns live games, drafts, and prop ideas into clear friendly wager boards with manual payment closeout.',
  image: '/brand/og/home.webp',
})

useWebPageSchema({
  name: 'Napkinbets',
  description:
    'A friendly wagering platform prototype for sports events, prop bet boards, and golf-draft style pools.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="napkinbets-hero-grid">
        <div class="space-y-5">
          <div class="space-y-3">
            <p class="napkinbets-kicker">Napkin-first wagering</p>
            <h1 class="napkinbets-hero-title">Welcome to the back of the napkin.</h1>
            <p class="napkinbets-hero-lede">
              Take the side bet out of the group chat, put it on a board, and settle it after the
              final.
            </p>
          </div>

          <div class="napkinbets-hero-actions">
            <UButton to="/discover" size="xl" color="primary" icon="i-lucide-radar">
              Browse the slate
            </UButton>
            <UButton
              :to="isAuthenticated ? '/wagers/create' : '/register'"
              size="xl"
              color="neutral"
              variant="soft"
              icon="i-lucide-ticket-plus"
            >
              {{ isAuthenticated ? 'Quick board' : 'Join Napkinbets' }}
            </UButton>
          </div>

          <div class="napkinbets-hero-pills">
            <span class="napkinbets-hero-pill">Pay off-platform</span>
            <span class="napkinbets-hero-pill">Live sports + golf</span>
            <span class="napkinbets-hero-pill">Picks, seats, reminders</span>
          </div>
        </div>

        <div class="napkinbets-hero-stack">
          <div class="napkinbets-aside-note">
            <p class="napkinbets-kicker">Board count</p>
            <p class="napkinbets-surface-value">{{ dashboard.metrics[0]?.value || '0' }}</p>
            <p class="napkinbets-support-copy">Boards already running in the workspace.</p>
          </div>

          <NapkinbetsSpotlightCard
            v-if="featuredSpotlights[0]"
            :spotlight="featuredSpotlights[0]"
          />
        </div>
      </div>
    </div>

    <UAlert
      v-if="dashboardState.error.value"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Home workspace failed to load"
      :description="dashboardState.error.value?.message || 'Please refresh and try again.'"
    />

    <div v-if="featuredSpotlights.length > 1" class="napkinbets-section-stack">
      <div class="flex items-end justify-between gap-3">
        <div class="space-y-1">
          <p class="napkinbets-kicker">Golf desk</p>
          <h2 class="napkinbets-section-title">Masters week and tour form</h2>
        </div>
        <UButton to="/discover" color="neutral" variant="ghost" icon="i-lucide-arrow-right">
          Open discovery
        </UButton>
      </div>

      <div class="napkinbets-spotlight-grid">
        <NapkinbetsSpotlightCard
          v-for="spotlight in featuredSpotlights.slice(1)"
          :key="spotlight.id"
          :spotlight="spotlight"
        />
      </div>
    </div>

    <div v-if="openingEvents.length" class="napkinbets-section-stack">
      <div class="flex items-end justify-between gap-3">
        <div class="space-y-1">
          <p class="napkinbets-kicker">On deck</p>
          <h2 class="napkinbets-section-title">Live and next-up events</h2>
        </div>
        <UButton to="/discover" color="neutral" variant="ghost">Full slate</UButton>
      </div>

      <div class="napkinbets-scroll-strip">
        <NapkinbetsEventCard v-for="event in openingEvents" :key="event.id" :event="event" />
      </div>
    </div>

    <div class="napkinbets-section-stack">
      <div class="flex items-end justify-between gap-3">
        <div class="space-y-1">
          <p class="napkinbets-kicker">Open boards</p>
          <h2 class="napkinbets-section-title">Boards already in motion</h2>
        </div>
        <UButton
          :to="isAuthenticated ? '/dashboard' : '/register'"
          color="primary"
          variant="soft"
          icon="i-lucide-layout-dashboard"
        >
          {{ isAuthenticated ? 'Your dashboard' : 'Create account' }}
        </UButton>
      </div>

      <div v-if="featuredWagers.length" class="grid gap-4 xl:grid-cols-2">
        <NapkinbetsWagerSummaryCard
          v-for="wager in featuredWagers"
          :key="wager.id"
          title="Tracked board"
          description="Seats, reminders, and settlement proof stay attached to the board."
          :wager="wager"
        />
      </div>

      <UAlert
        v-else
        color="info"
        variant="soft"
        icon="i-lucide-ticket"
        title="No boards yet"
        description="Start from discovery or spin up a quick manual board for tonight."
      />
    </div>
  </div>
</template>
