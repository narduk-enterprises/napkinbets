<script setup lang="ts">
const { isAuthenticated } = useNapkinbetsNavLinks()
const discoverState = await useNapkinbetsDiscover()
const workspaceState = isAuthenticated.value
  ? useNapkinbetsWorkspace({
      server: false,
      lazy: true,
    })
  : null

const discover = computed(() => discoverState.data.value)
const workspace = computed(() => workspaceState?.data.value ?? null)
const workspaceBetCount = computed(
  () => (workspace.value?.ownedWagers.length ?? 0) + (workspace.value?.joinedWagers.length ?? 0),
)
const featuredWagers = computed(() => {
  if (!workspace.value) {
    return []
  }

  return [...workspace.value.ownedWagers, ...workspace.value.joinedWagers].slice(0, 2)
})
const featuredSpotlight = computed(() => discover.value.spotlights[0] ?? null)
const openingEvents = computed(() =>
  discover.value.sections
    .flatMap((section) => section.events)
    .slice(0, isAuthenticated.value ? 4 : 2),
)

useSeo({
  title: 'Real games first. Simple bets second.',
  description:
    'Napkinbets starts with real games, then helps you spin up simple bets and group bets without the usual text-thread mess.',
  image: '/brand/og/home.webp',
})

useWebPageSchema({
  name: 'Napkinbets',
  description:
    'A social sports app for starting bets from real games and settling up off-platform.',
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
                  ? 'Start from a real game and keep the bet clear.'
                  : 'Pick a game. Start a bet. Settle after the final.'
              }}
            </h1>
            <p class="napkinbets-hero-lede">
              {{
                isAuthenticated
                  ? 'Browse events first, choose one-on-one or group only if you need it, and keep the rest short.'
                  : 'Napkinbets helps you turn a live or upcoming game into a simple side bet without rebuilding the whole setup by hand.'
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
              icon="i-lucide-ticket-plus"
            >
              {{ isAuthenticated ? 'Start a custom bet' : 'Create account' }}
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
          <ClientOnly v-if="isAuthenticated">
            <template #fallback>
              <div class="napkinbets-aside-note">
                <p class="napkinbets-kicker">My bets</p>
                <p class="napkinbets-support-copy">Loading your started and joined bets.</p>
              </div>
            </template>

            <div class="napkinbets-aside-note">
              <p class="napkinbets-kicker">My bets</p>
              <p class="napkinbets-surface-value">{{ workspaceBetCount }}</p>
              <p class="napkinbets-support-copy">Started, joined, and still waiting on a result.</p>
            </div>
          </ClientOnly>

          <div v-else class="napkinbets-aside-note">
            <p class="napkinbets-kicker">What it does</p>
            <p class="napkinbets-support-copy">
              Start from a game, invite one person or a group, and settle after it goes final.
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
            {{ isAuthenticated ? 'Pick a game and go' : 'A few good games to start from' }}
          </h2>
        </div>
        <UButton to="/events" color="neutral">
          {{ isAuthenticated ? 'All games' : 'More games' }}
        </UButton>
      </div>

      <div class="napkinbets-scroll-strip">
        <NapkinbetsEventCard v-for="event in openingEvents" :key="event.id" :event="event" />
      </div>
    </div>

    <ClientOnly v-if="isAuthenticated">
      <template #fallback>
        <div class="napkinbets-section-stack">
          <div class="flex items-end justify-between gap-3">
            <div class="space-y-1">
              <p class="napkinbets-kicker">Open bets</p>
              <h2 class="napkinbets-section-title">Loading your active bets</h2>
            </div>
            <UButton to="/dashboard" color="primary" icon="i-lucide-layout-dashboard">
              My bets
            </UButton>
          </div>
        </div>
      </template>

      <div class="napkinbets-section-stack">
      <div class="flex items-end justify-between gap-3">
        <div class="space-y-1">
          <p class="napkinbets-kicker">Open bets</p>
          <h2 class="napkinbets-section-title">Bets already in motion</h2>
        </div>
        <UButton to="/dashboard" color="primary" icon="i-lucide-layout-dashboard">
          My bets
        </UButton>
      </div>

      <div v-if="featuredWagers.length" class="grid gap-4 xl:grid-cols-2">
        <NapkinbetsNapkinSummaryCard
          v-for="wager in featuredWagers"
          :key="wager.id"
          title="Open bet"
          description="People, picks, reminders, and payment follow-up stay in one place."
          :wager="wager"
        />
      </div>

      <UAlert
        v-else
        color="info"
        variant="soft"
        icon="i-lucide-ticket"
        title="No bets yet"
        description="Start from Events first, or make a quick custom bet when the game is not listed."
      />
      </div>
    </ClientOnly>
  </div>
</template>
