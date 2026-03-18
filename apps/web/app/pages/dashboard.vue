<script setup lang="ts">
import type { NapkinbetsWager } from '../../types/napkinbets'

definePageMeta({ middleware: ['auth'] })

const workspaceState = useNapkinbetsWorkspace({
  server: false,
  lazy: true,
})
const workspace = computed(() => workspaceState.data.value)

const ledgerState = useNapkinbetsLedger({ server: false, lazy: true })
const ledger = computed(() => ledgerState.data.value)

const ledgerNetCents = computed(
  () => ledger.value.totalOwedToYouCents - ledger.value.totalOwedCents,
)

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.abs(cents) / 100)
}
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
  <div class="napkinbets-page napkinbets-dashboard">
    <ClientOnly>
      <template #fallback>
        <div class="napkinbets-dashboard-content" aria-busy="true" aria-live="polite">
          <p class="sr-only">Pulling your bets and invitations.</p>
          <div class="napkinbets-stats-strip">
            <USkeleton v-for="i in 5" :key="i" class="h-5 w-24 rounded-md" />
          </div>
          <div class="napkinbets-ledger-summary">
            <USkeleton class="h-5 w-16 rounded-md" />
            <USkeleton class="h-5 w-20 rounded-md" />
            <USkeleton class="h-5 w-20 rounded-md" />
            <USkeleton class="h-5 w-14 rounded-md" />
          </div>
          <div class="flex flex-wrap gap-2">
            <USkeleton v-for="i in 4" :key="i" class="h-8 w-20 rounded-full" />
          </div>
          <div class="space-y-2">
            <div
              v-for="i in 4"
              :key="i"
              class="napkinbets-compact-card items-center gap-3 opacity-60"
            >
              <div class="flex gap-1.5">
                <USkeleton class="h-5 w-12 rounded-full" />
                <USkeleton class="h-5 w-14 rounded-full" />
              </div>
              <div class="min-w-0 space-y-1.5">
                <USkeleton class="h-3.5 w-full max-w-48" />
                <USkeleton class="h-3 w-3/4 max-w-36" />
              </div>
              <div class="text-right">
                <USkeleton class="ml-auto h-3.5 w-10" />
                <USkeleton class="ml-auto mt-1 h-3 w-14" />
              </div>
            </div>
          </div>
        </div>
      </template>

      <div class="napkinbets-dashboard-content">
        <UAlert
          v-if="workspaceState.error.value"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          title="Dashboard failed to load"
          :description="workspaceState.error.value.message"
        />

        <div
          v-else-if="isInitialWorkspaceLoad"
          class="napkinbets-dashboard-content"
          aria-busy="true"
          aria-live="polite"
        >
          <p class="sr-only">Pulling your bets, invitations, and settlements. Loading your bets.</p>
          <div class="napkinbets-stats-strip">
            <USkeleton v-for="i in 5" :key="i" class="h-5 w-24 rounded-md" />
          </div>
          <div class="napkinbets-ledger-summary">
            <USkeleton class="h-5 w-16 rounded-md" />
            <USkeleton class="h-5 w-20 rounded-md" />
            <USkeleton class="h-5 w-20 rounded-md" />
            <USkeleton class="h-5 w-14 rounded-md" />
          </div>
          <div class="flex flex-wrap gap-2">
            <USkeleton v-for="i in 4" :key="i" class="h-8 w-20 rounded-full" />
          </div>
          <div class="space-y-2">
            <div
              v-for="i in 4"
              :key="i"
              class="napkinbets-compact-card items-center gap-3 opacity-60"
            >
              <div class="flex gap-1.5">
                <USkeleton class="h-5 w-12 rounded-full" />
                <USkeleton class="h-5 w-14 rounded-full" />
              </div>
              <div class="min-w-0 space-y-1.5">
                <USkeleton class="h-3.5 w-full max-w-48" />
                <USkeleton class="h-3 w-3/4 max-w-36" />
              </div>
              <div class="text-right">
                <USkeleton class="ml-auto h-3.5 w-10" />
                <USkeleton class="ml-auto mt-1 h-3 w-14" />
              </div>
            </div>
          </div>
        </div>

        <template v-else>
          <!-- Compact stats: at-a-glance only -->
          <NapkinbetsDashboardStatsStrip :metrics="workspace.metrics" />

          <!-- Ledger summary -->
          <NuxtLink to="/ledger" class="napkinbets-ledger-summary">
            <span class="napkinbets-ledger-summary-label">
              <UIcon name="i-lucide-book-open" class="size-4 shrink-0" aria-hidden="true" />
              Ledger
            </span>
            <template v-if="ledgerState.status.value === 'pending'">
              <span class="napkinbets-ledger-summary-value text-muted">—</span>
              <span class="napkinbets-ledger-summary-value text-muted">—</span>
              <span class="napkinbets-ledger-summary-value text-muted">—</span>
            </template>
            <template v-else>
              <span class="napkinbets-ledger-summary-item">
                <span class="napkinbets-ledger-summary-meta">You owe</span>
                <span
                  class="napkinbets-ledger-summary-value"
                  :class="ledger.totalOwedCents > 0 ? 'text-error' : ''"
                >
                  {{ formatCurrency(ledger.totalOwedCents) }}
                </span>
              </span>
              <span class="napkinbets-ledger-summary-item">
                <span class="napkinbets-ledger-summary-meta">Owed to you</span>
                <span
                  class="napkinbets-ledger-summary-value"
                  :class="ledger.totalOwedToYouCents > 0 ? 'text-success' : ''"
                >
                  {{ formatCurrency(ledger.totalOwedToYouCents) }}
                </span>
              </span>
              <span class="napkinbets-ledger-summary-item">
                <span class="napkinbets-ledger-summary-meta">Net</span>
                <span
                  class="napkinbets-ledger-summary-value"
                  :class="ledgerNetCents >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ ledgerNetCents >= 0 ? '+' : '-' }}{{ formatCurrency(ledgerNetCents) }}
                </span>
              </span>
            </template>
            <UIcon
              name="i-lucide-chevron-right"
              class="napkinbets-ledger-summary-chevron"
              aria-hidden="true"
            />
          </NuxtLink>

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

          <!-- Your bets: main content -->
          <section class="space-y-3" aria-labelledby="dashboard-your-bets-heading">
            <h2 id="dashboard-your-bets-heading" class="napkinbets-section-heading">Your bets</h2>
            <NapkinbetsWagerListFilters
              :chips="filterChips"
              :model-value="activeFilter"
              @update:model-value="setWagerFilter"
            />

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
          </section>
        </template>
      </div>
    </ClientOnly>
  </div>
</template>
