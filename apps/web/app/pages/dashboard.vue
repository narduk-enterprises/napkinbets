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

type DashboardFilter = 'all' | 'upcoming' | 'live' | 'finished' | 'settled' | 'unsettled'

const activeFilter = ref<DashboardFilter>('all')

const filterChips: Array<{ value: DashboardFilter; label: string; icon: string }> = [
  { value: 'all', label: 'All', icon: 'i-lucide-layers' },
  { value: 'upcoming', label: 'Upcoming', icon: 'i-lucide-calendar-clock' },
  { value: 'live', label: 'Live', icon: 'i-lucide-zap' },
  { value: 'finished', label: 'Finished', icon: 'i-lucide-flag-triangle-right' },
  { value: 'settled', label: 'Settled', icon: 'i-lucide-check-circle-2' },
  { value: 'unsettled', label: 'Unsettled', icon: 'i-lucide-circle-alert' },
]

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

function isFinished(wager: TaggedWager['wager']): boolean {
  return (
    wager.status === 'settling' ||
    wager.status === 'settled' ||
    wager.status === 'closed' ||
    wager.status === 'archived'
  )
}

function isFullySettled(wager: TaggedWager['wager']): boolean {
  if (!isFinished(wager)) return false
  const settlements = wager.settlements ?? []
  return settlements.length > 0 && settlements.every((s) => s.verificationStatus === 'confirmed')
}

const filteredBets = computed(() => {
  return allBets.value.filter(({ wager }) => {
    switch (activeFilter.value) {
      case 'upcoming':
        return wager.status === 'open'
      case 'live':
        return wager.status === 'live' || wager.status === 'locked'
      case 'finished':
        return isFinished(wager)
      case 'settled':
        return isFullySettled(wager)
      case 'unsettled':
        return isFinished(wager) && !isFullySettled(wager)
      default:
        return true
    }
  })
})

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
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="chip in filterChips"
              :key="chip.value"
              :color="activeFilter === chip.value ? 'primary' : 'neutral'"
              :variant="activeFilter === chip.value ? 'soft' : 'ghost'"
              size="sm"
              :icon="chip.icon"
              @click="activeFilter = chip.value"
            >
              {{ chip.label }}
            </UButton>
          </div>

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
