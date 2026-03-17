<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const workspaceState = useNapkinbetsWorkspace({
  server: false,
  lazy: true,
})
const workspace = computed(() => workspaceState.data.value)

useNapkinbetsAutoRefresh(workspaceState.refresh)

useSeo({
  title: 'My pools',
  description:
    'Manage the pools you host, the ones you joined, and the payment follow-up still waiting on action.',
  image: '/brand/og/dashboard.webp',
})

useWebPageSchema({
  name: 'Napkinbets My Pools',
  description: 'A protected dashboard for managing pools, picks, reminders, and settle-up tasks.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="space-y-4">
        <p class="napkinbets-kicker">My pools</p>
        <h1 class="napkinbets-section-title">
          Everything you host, joined, or still need to settle.
        </h1>
        <p class="napkinbets-hero-lede">
          Keep the active pools, player follow-up, and payment confirmation in one place instead of
          chasing it through messages.
        </p>
      </div>
    </div>

    <ClientOnly>
      <template #fallback>
        <div class="napkinbets-aside-note">
          <p class="napkinbets-kicker">Loading</p>
          <p class="napkinbets-support-copy">Pulling your pools, reminders, and settle-up queue.</p>
        </div>
      </template>

      <div class="space-y-6">
        <UAlert
          v-if="workspaceState.error.value"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          title="My pools failed to load"
          :description="workspaceState.error.value.message"
        />

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
                <p class="napkinbets-kicker">Hosted pools</p>
                <h2 class="napkinbets-subsection-title">You run these</h2>
              </div>

              <UButton
                to="/napkins/create"
                color="primary"
                variant="soft"
                icon="i-lucide-ticket-plus"
              >
                Start a pool
              </UButton>
            </div>

            <div v-if="workspace.ownedWagers.length" class="space-y-4">
              <NapkinbetsNapkinSummaryCard
                v-for="wager in workspace.ownedWagers"
                :key="wager.id"
                title="Host view"
                description="Open the pool to manage players, picks, reminders, and payment confirmation."
                :wager="wager"
                action-label="Manage pool"
              />
            </div>

            <UAlert
              v-else
              color="info"
              variant="soft"
              icon="i-lucide-ticket-plus"
              title="No hosted pools yet"
              description="Start with events, then turn a live or upcoming game into a pool."
            />

            <div class="space-y-3 pt-4">
              <p class="napkinbets-kicker">Joined pools</p>
              <div v-if="workspace.joinedWagers.length" class="space-y-4">
                <NapkinbetsNapkinSummaryCard
                  v-for="wager in workspace.joinedWagers"
                  :key="wager.id"
                  title="Player view"
                  description="Open the pool to add picks or confirm payment proof."
                  :wager="wager"
                  action-label="Open pool"
                />
              </div>

              <UAlert
                v-else
                color="neutral"
                variant="soft"
                icon="i-lucide-users"
                title="You have not joined any pools yet"
                description="Use events to find a live or upcoming game, or join a pool from a shared link."
              />
            </div>
          </div>

          <NapkinbetsReminderRail
            title="Queued reminders"
            empty-label="Your queue is clear"
            :reminders="workspace.reminders"
          />
        </div>
      </div>
    </ClientOnly>
  </div>
</template>
