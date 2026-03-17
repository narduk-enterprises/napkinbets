<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const workspaceState = await useNapkinbetsWorkspace()
const workspace = computed(() => workspaceState.data.value)

useNapkinbetsAutoRefresh(workspaceState.refresh)

useSeo({
  title: 'Your wager workspace',
  description:
    'Manage the boards you own, the wagers you joined, and the reminders or settlements still waiting on action.',
  ogImage: {
    title: 'Napkinbets Dashboard',
    description: 'Workspace for owned boards, joined wagers, and queued reminders.',
    icon: '📋',
  },
})

useWebPageSchema({
  name: 'Napkinbets Dashboard',
  description:
    'A protected dashboard for managing friendly wager boards, reminders, and settlements.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="space-y-4">
        <p class="napkinbets-kicker">Your workspace</p>
        <h1 class="napkinbets-section-title">Welcome back to the boards you own, the ones you joined, and what still needs attention.</h1>
        <p class="napkinbets-hero-lede">
          Wager creation, participant follow-up, and settlement proof all move through the dashboard instead of being buried in a single public page.
        </p>
      </div>
    </div>

    <ClientOnly>
      <template #fallback>
        <div class="napkinbets-aside-note">
          <p class="napkinbets-kicker">Workspace loading</p>
          <p class="napkinbets-support-copy">
            Pulling your boards, reminders, and settlement queue.
          </p>
        </div>
      </template>

      <div class="space-y-6">
        <UAlert
          v-if="workspaceState.error.value"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          title="Workspace failed to load"
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
                <p class="napkinbets-kicker">Owned boards</p>
                <h2 class="napkinbets-subsection-title">You manage these</h2>
              </div>

              <UButton to="/wagers/create" color="primary" variant="soft" icon="i-lucide-ticket-plus">
                New board
              </UButton>
            </div>

            <div v-if="workspace.ownedWagers.length" class="space-y-4">
              <NapkinbetsWagerSummaryCard
                v-for="wager in workspace.ownedWagers"
                :key="wager.id"
                title="Owner lane"
                description="Open the board to manage draft order, reminders, picks, and settlement proof."
                :wager="wager"
                action-label="Manage board"
              />
            </div>

            <UAlert
              v-else
              color="info"
              variant="soft"
              icon="i-lucide-ticket-plus"
              title="No boards owned yet"
              description="Start with the discover page, then turn one live or upcoming event into a board."
            />

            <div class="space-y-3 pt-4">
              <p class="napkinbets-kicker">Joined boards</p>
              <div v-if="workspace.joinedWagers.length" class="space-y-4">
                <NapkinbetsWagerSummaryCard
                  v-for="wager in workspace.joinedWagers"
                  :key="wager.id"
                  title="Participant lane"
                  description="Open the board to add picks or confirm payment proof."
                  :wager="wager"
                  action-label="Open board"
                />
              </div>

              <UAlert
                v-else
                color="neutral"
                variant="soft"
                icon="i-lucide-users"
                title="You have not joined any boards yet"
                description="Use the discover page to find a live or upcoming event and create one, or join a board from a shared link."
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
