<script setup lang="ts">
const dashboardState = await useNapkinbetsDashboard()
const { isAuthenticated } = useNapkinbetsNavLinks()

const dashboard = computed(() => dashboardState.data.value)
const featuredWagers = computed(() => dashboard.value.wagers.slice(0, 3))

useSeo({
  title: 'Friendly wager boards for sports nights, drafts, and prop bets',
  description:
    'Napkinbets turns live games, drafts, and prop ideas into clear friendly wager boards with manual payment closeout.',
  ogImage: {
    title: 'Napkinbets',
    description: 'Friendly boards for live games, drafts, and side bets.',
    icon: '🧾',
  },
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
        <div class="space-y-6">
          <div class="space-y-4">
            <p class="napkinbets-kicker">Flagship fleet prototype</p>
            <h1 class="napkinbets-hero-title">
              Friendly boards for live games, drafts, and side bets.
            </h1>
            <p class="napkinbets-hero-lede">
              Start from current sports context, lock the terms, and settle through Venmo, PayPal,
              Cash App, or Zelle when the result is final.
            </p>
          </div>

          <div class="napkinbets-hero-actions">
            <UButton to="/discover" size="xl" color="primary" icon="i-lucide-calendar-range">
              Browse upcoming events
            </UButton>
            <UButton
              :to="isAuthenticated ? '/wagers/create' : '/register'"
              size="xl"
              color="neutral"
              variant="soft"
              icon="i-lucide-ticket-plus"
            >
              {{ isAuthenticated ? 'Create a board' : 'Create an account' }}
            </UButton>
          </div>

          <div class="napkinbets-hero-pills">
            <span class="napkinbets-hero-pill">
              <UIcon name="i-lucide-calendar-range" class="size-4 text-primary" />
              Current and upcoming sports context
            </span>
            <span class="napkinbets-hero-pill">
              <UIcon name="i-lucide-wallet-cards" class="size-4 text-primary" />
              Manual p2p closeout
            </span>
            <span class="napkinbets-hero-pill">
              <UIcon name="i-lucide-shuffle" class="size-4 text-primary" />
              Picks, draft order, and reminders
            </span>
          </div>
        </div>

        <div class="napkinbets-hero-stack">
          <div class="napkinbets-aside-note">
            <p class="napkinbets-kicker">Board count</p>
            <p class="text-3xl font-display text-default">
              {{ dashboard.metrics[0]?.value || '0' }}
            </p>
            <p class="napkinbets-support-copy">
              Live, open, and settled boards all roll into one workspace instead of living in a
              group chat scrollback.
            </p>
          </div>

          <div class="napkinbets-aside-note">
            <p class="napkinbets-kicker">Core flow</p>
            <div class="napkinbets-process-list">
              <div class="napkinbets-process-item">
                <span class="napkinbets-process-step">1</span>
                <div>
                  <p class="font-semibold text-default">Pick the event</p>
                  <p class="napkinbets-support-copy">
                    Use discovery to turn a game, draft, or prop idea into a board.
                  </p>
                </div>
              </div>
              <div class="napkinbets-process-item">
                <span class="napkinbets-process-step">2</span>
                <div>
                  <p class="font-semibold text-default">Run the board</p>
                  <p class="napkinbets-support-copy">
                    Track joins, draft order, picks, reminders, and side selection in one place.
                  </p>
                </div>
              </div>
              <div class="napkinbets-process-item">
                <span class="napkinbets-process-step">3</span>
                <div>
                  <p class="font-semibold text-default">Close it out</p>
                  <p class="napkinbets-support-copy">
                    Manual settlement proof and the Closeout Playbook keep payout cleanup organized.
                  </p>
                </div>
              </div>
            </div>
          </div>
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

    <div class="napkinbets-metric-grid">
      <NapkinbetsMetricCard
        v-for="metric in dashboard.metrics"
        :key="metric.label"
        :metric="metric"
      />
    </div>

    <div class="napkinbets-section-stack">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div class="space-y-2">
          <p class="napkinbets-kicker">Fast path</p>
          <h2 class="napkinbets-section-title">Discover. Board. Close out.</h2>
          <p class="napkinbets-support-copy">
            The home screen stays short. Discovery handles event intake, board pages handle
            operations, and closeout handles settlement cleanup.
          </p>
        </div>

        <UButton to="/discover" color="neutral" variant="soft" icon="i-lucide-arrow-right">
          Open discovery
        </UButton>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <div class="napkinbets-aside-note">
          <p class="napkinbets-kicker">1. Discover</p>
          <h3 class="napkinbets-subsection-title">Upcoming and in-progress events</h3>
          <p class="napkinbets-support-copy">
            ESPN-backed discovery will stay focused on sports that matter right now, with a small
            set of prop-style ideas layered in.
          </p>
        </div>

        <div class="napkinbets-aside-note">
          <p class="napkinbets-kicker">2. Board</p>
          <h3 class="napkinbets-subsection-title">Participant and wager management</h3>
          <p class="napkinbets-support-copy">
            Create boards, assign sides, randomize draft order, and keep reminders or payment status
            visible to the room.
          </p>
        </div>

        <div class="napkinbets-aside-note">
          <p class="napkinbets-kicker">3. Closeout</p>
          <h3 class="napkinbets-subsection-title">Manual settlement with proof</h3>
          <p class="napkinbets-support-copy">
            Payment apps stay external. Napkinbets stores the preferred handles, proof, confirmation
            state, and payout checklist.
          </p>
        </div>
      </div>
    </div>

    <div class="napkinbets-section-stack">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div class="space-y-2">
          <p class="napkinbets-kicker">Active boards</p>
          <h2 class="napkinbets-section-title">Open a real board, not a one-page demo.</h2>
          <p class="napkinbets-support-copy">
            Registration, admin views, payment settings, and wager management now live behind
            navigation instead of piling everything onto one screen.
          </p>
        </div>

        <UButton
          :to="isAuthenticated ? '/dashboard' : '/register'"
          color="primary"
          variant="soft"
          icon="i-lucide-layout-dashboard"
        >
          {{ isAuthenticated ? 'Open your dashboard' : 'Get started' }}
        </UButton>
      </div>

      <div v-if="featuredWagers.length" class="space-y-4">
        <NapkinbetsWagerSummaryCard
          v-for="wager in featuredWagers"
          :key="wager.id"
          title="Tracked board"
          description="Open the board to manage joins, picks, reminders, and settlement proof."
          :wager="wager"
        />
      </div>

      <UAlert
        v-else
        color="info"
        variant="soft"
        icon="i-lucide-ticket"
        title="No boards yet"
        description="Create the first board from discovery or invite a few participants into a custom prop board."
      />
    </div>
  </div>
</template>
