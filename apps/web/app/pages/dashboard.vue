<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const workspaceState = useNapkinbetsWorkspace({
  server: false,
  lazy: true,
})
const workspace = computed(() => workspaceState.data.value)
const isInitialWorkspaceLoad = computed(() => {
  if (workspaceState.status.value !== 'pending') {
    return false
  }

  return (
    workspace.value.metrics.length === 0 &&
    workspace.value.ownedWagers.length === 0 &&
    workspace.value.joinedWagers.length === 0 &&
    workspace.value.reminders.length === 0
  )
})

useNapkinbetsAutoRefresh(workspaceState.refresh)

useSeo({
  title: 'My bets',
  description:
    'Manage the bets you started, the ones you joined, and the settle-up follow-up still waiting on action.',
  image: '/brand/og/dashboard.webp',
})

useWebPageSchema({
  name: 'Napkinbets My Bets',
  description: 'A protected dashboard for managing bets, picks, reminders, and settle-up tasks.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="space-y-4">
        <p class="napkinbets-kicker">My bets</p>
        <h1 class="napkinbets-section-title">Everything you started, joined, or still need to settle.</h1>
        <p class="napkinbets-hero-lede">
          Keep the active bets, player follow-up, and payment confirmation in one place instead of
          chasing it through messages.
        </p>
        <div class="flex flex-wrap gap-2">
          <UButton to="/friends" color="neutral" variant="soft" icon="i-lucide-user-round-plus">
            Friends
          </UButton>
          <UButton to="/groups" color="neutral" variant="soft" icon="i-lucide-users-round">
            Groups
          </UButton>
          <UButton to="/guide" color="neutral" variant="soft" icon="i-lucide-book-open-text">
            Help
          </UButton>
        </div>
      </div>
    </div>

    <ClientOnly>
      <template #fallback>
        <div class="napkinbets-aside-note">
          <p class="napkinbets-kicker">Loading</p>
          <p class="napkinbets-support-copy">
            Pulling your bets, reminders, and settle-up queue.
          </p>
        </div>
      </template>

      <div class="space-y-6">
        <UAlert
          v-if="workspaceState.error.value"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          title="My bets failed to load"
          :description="workspaceState.error.value.message"
        />

        <div v-else-if="isInitialWorkspaceLoad" class="napkinbets-aside-note">
          <p class="napkinbets-kicker">Loading</p>
          <p class="napkinbets-support-copy">
            Pulling your started bets, joined bets, and reminder queue.
          </p>
          <div class="pt-3">
            <UButton color="neutral" variant="ghost" loading> Loading your bets </UButton>
          </div>
        </div>

        <template v-else>
          <div class="napkinbets-metric-grid">
            <NapkinbetsMetricCard
              v-for="metric in workspace.metrics"
              :key="metric.label"
              :metric="metric"
            />
          </div>

          <div class="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div class="space-y-4">
              <div class="flex items-center justify-between gap-3">
                <div class="space-y-1">
                  <p class="napkinbets-kicker">Bets you started</p>
                  <h2 class="napkinbets-subsection-title">You run these</h2>
                </div>

                <UButton
                  to="/napkins/create"
                  color="primary"
                  variant="soft"
                  icon="i-lucide-ticket-plus"
                >
                  Start a bet
                </UButton>
              </div>

              <div v-if="workspace.ownedWagers.length" class="space-y-4">
                <NapkinbetsNapkinSummaryCard
                  v-for="wager in workspace.ownedWagers"
                  :key="wager.id"
                  title="Host view"
                  description="Open the bet to manage people, picks, reminders, and payment confirmation."
                  :wager="wager"
                  action-label="Manage bet"
                />
              </div>

              <UAlert
                v-else
                color="info"
                variant="soft"
                icon="i-lucide-ticket-plus"
                title="No started bets yet"
                description="Start from Events first, or build a quick custom bet for your room."
              />

              <div class="space-y-3 pt-4">
                <p class="napkinbets-kicker">Bets you joined</p>
                <div v-if="workspace.joinedWagers.length" class="space-y-4">
                  <NapkinbetsNapkinSummaryCard
                    v-for="wager in workspace.joinedWagers"
                    :key="wager.id"
                    title="Player view"
                    description="Open the bet to add picks or confirm payment proof."
                    :wager="wager"
                    action-label="Open bet"
                  />
                </div>

                <UAlert
                  v-else
                  color="neutral"
                  variant="soft"
                  icon="i-lucide-users"
                  title="You have not joined any bets yet"
                  description="Use Events to find a live or upcoming game, or join a bet from a shared link."
                />
              </div>
            </div>

            <NapkinbetsReminderRail
              title="Queued reminders"
              empty-label="Your queue is clear"
              :reminders="workspace.reminders"
            />
          </div>
        </template>
      </div>
    </ClientOnly>
  </div>
</template>
