<script setup lang="ts">
import type { NapkinbetsWager } from '../../types/napkinbets'

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
    workspace.value.invitedWagers.length === 0 &&
    workspace.value.reminders.length === 0
  )
})

useNapkinbetsAutoRefresh(workspaceState.refresh)

const { filterChips, activeFilter, filterWagerList } = useNapkinbetsWagerListFilter({
  extended: true,
})

interface TaggedWager {
  wager: NapkinbetsWager
  role: 'owner' | 'player' | 'invited'
}

const allBets = computed<TaggedWager[]>(() => {
  const owned: TaggedWager[] = workspace.value.ownedWagers.map((w) => ({
    wager: w,
    role: 'owner' as const,
  }))
  const joined: TaggedWager[] = workspace.value.joinedWagers.map((w) => ({
    wager: w,
    role: 'player' as const,
  }))
  return [...owned, ...joined]
})

const filteredBets = computed(() => {
  const wagers = allBets.value.map((b) => b.wager)
  const allowedIds = new Set(filterWagerList(wagers).map((w) => w.id))
  return allBets.value.filter(({ wager }) => allowedIds.has(wager.id))
})

function setWagerFilter(
  v: import('../composables/useNapkinbetsWagerListFilter').NapkinbetsWagerListFilterValue,
) {
  activeFilter.value = v
}

useSeo({
  title: 'Dashboard',
  description:
    'Manage the bets you started, the ones you joined, and pending invitations waiting for your response.',
  image: '/brand/og/dashboard.webp',
})

useWebPageSchema({
  name: 'Napkinbets Dashboard',
  description: 'A protected dashboard for managing bets, picks, and settle-up tasks.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="space-y-4">
        <p class="napkinbets-kicker">Dashboard</p>
        <h1 class="napkinbets-section-title">
          Everything you started, joined, or still need to settle.
        </h1>
        <div class="flex flex-wrap gap-2">
          <UButton to="/napkins/create" color="primary" variant="soft" icon="i-lucide-ticket-plus">
            Create Napkin
          </UButton>
          <UButton to="/friends" color="neutral" variant="soft" icon="i-lucide-user-round-plus">
            Friends
          </UButton>
          <UButton to="/groups" color="neutral" variant="soft" icon="i-lucide-users-round">
            Groups
          </UButton>
          <UButton to="/ledger" color="neutral" variant="soft" icon="i-lucide-book-open">
            Ledger
          </UButton>
        </div>
      </div>
    </div>

    <ClientOnly>
      <template #fallback>
        <div class="napkinbets-aside-note">
          <p class="napkinbets-kicker">Loading</p>
          <p class="napkinbets-support-copy">Pulling your bets and invitations.</p>
        </div>
      </template>

      <div class="space-y-6">
        <UAlert
          v-if="workspaceState.error.value"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          title="Dashboard failed to load"
          :description="workspaceState.error.value.message"
        />

        <div v-else-if="isInitialWorkspaceLoad" class="napkinbets-aside-note">
          <p class="napkinbets-kicker">Loading</p>
          <p class="napkinbets-support-copy">Pulling your bets, invitations, and settlements.</p>
          <div class="pt-3">
            <UButton color="neutral" variant="ghost" loading> Loading your bets </UButton>
          </div>
        </div>

        <template v-else>
          <!-- Metrics row -->
          <div class="napkinbets-metric-grid">
            <NapkinbetsMetricCard
              v-for="metric in workspace.metrics"
              :key="metric.label"
              :metric="metric"
            />
          </div>

          <!-- Pending invitations banner -->
          <div v-if="workspace.invitedWagers.length" class="space-y-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-mail-warning" class="size-5 text-warning" />
              <h2 class="text-sm font-bold tracking-wide text-warning uppercase">
                Pending Invitations
              </h2>
              <UBadge color="warning" variant="soft" size="xs">
                {{ workspace.invitedWagers.length }}
              </UBadge>
            </div>
            <div class="space-y-2">
              <NapkinbetsNapkinSummaryCard
                v-for="wager in workspace.invitedWagers"
                :key="wager.id"
                :wager="wager"
                role="invited"
              />
            </div>
          </div>

          <!-- Filter chips -->
          <NapkinbetsWagerListFilters
            :chips="filterChips"
            :model-value="activeFilter"
            @update:model-value="setWagerFilter"
          />

          <!-- Unified bet list -->
          <div v-if="filteredBets.length" class="space-y-2">
            <NapkinbetsNapkinSummaryCard
              v-for="{ wager, role } in filteredBets"
              :key="wager.id"
              :wager="wager"
              :role="role"
            />
          </div>

          <UAlert
            v-else-if="activeFilter !== 'all'"
            color="neutral"
            variant="soft"
            icon="i-lucide-filter-x"
            title="No bets match this filter"
            description="Try a different filter or create a new napkin."
          />

          <UAlert
            v-else
            color="info"
            variant="soft"
            icon="i-lucide-ticket-plus"
            title="No bets yet"
            description="Start from Events first, or create a quick custom bet."
          />
        </template>
      </div>
    </ClientOnly>
  </div>
</template>
