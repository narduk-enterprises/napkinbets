<script setup lang="ts">
const adminState = await useNapkinbetsAdmin()
const actions = useNapkinbetsActions(adminState.refresh)
const admin = computed(() => adminState.data.value)

async function runIngest(tier: 'live-window' | 'next-48h' | 'next-7d' | 'next-8w') {
  await actions.runAdminIngest(tier)
}

const TIER_META = [
  {
    key: 'live-window' as const,
    label: 'Live Window',
    description: 'Games from yesterday through tomorrow',
    schedule: 'Every 1m',
  },
  {
    key: 'next-48h' as const,
    label: 'Next 48 Hours',
    description: 'Events starting within the next two days',
    schedule: 'Every 10m',
  },
  {
    key: 'next-7d' as const,
    label: 'Next 7 Days',
    description: 'Events across the next full week',
    schedule: 'Every 6h',
  },
  {
    key: 'next-8w' as const,
    label: '8 Weeks Out',
    description: 'All events across the next eight weeks',
    schedule: 'Every 12h',
  },
] as const

const tierCards = computed(() =>
  TIER_META.map((meta) => ({
    ...meta,
    summary: admin.value.tierSummaries[meta.key] ?? null,
  })),
)

function timeAgo(value: string | null) {
  if (!value) return 'never'
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function runDuration(startedAt: string, completedAt: string | null) {
  if (!completedAt) return '—'
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime()
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const ingestRunColumns = [
  { accessorKey: 'tier', header: 'Tier' },
  { accessorKey: 'league', header: 'League' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'eventCount', header: 'Events' },
  { accessorKey: 'duration', header: 'Duration' },
  { accessorKey: 'startedAt', header: 'Started' },
  { accessorKey: 'errorMessage', header: 'Error' },
]

const ingestRunRows = computed(() =>
  admin.value.ingestRuns.map((run) => ({
    ...run,
    league: run.league.toUpperCase(),
    duration: runDuration(run.startedAt, run.completedAt),
    startedAt: timeAgo(run.startedAt),
    errorMessage: run.errorMessage || '',
  })),
)
</script>

<template>
  <div class="space-y-4">
    <div class="napkinbets-metric-grid">
      <NapkinbetsMetricCard v-for="metric in admin.metrics" :key="metric.label" :metric="metric" />
    </div>

    <UCard class="napkinbets-panel">
      <div class="space-y-4">
        <div class="space-y-2">
          <p class="napkinbets-kicker">Operations</p>
          <h2 class="napkinbets-subsection-title">Event coverage and ingest health</h2>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <UCard v-for="tier in tierCards" :key="tier.key" class="napkinbets-panel">
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div class="space-y-1">
                  <p class="font-semibold text-default">{{ tier.label }}</p>
                  <p class="text-sm text-muted">{{ tier.description }}</p>
                </div>
                <UBadge color="neutral" variant="subtle" class="shrink-0">
                  {{ tier.schedule }}
                </UBadge>
              </div>

              <div v-if="tier.summary?.lastRunAt" class="flex flex-wrap items-center gap-2">
                <UBadge
                  :color="
                    tier.summary.lastStatus === 'success'
                      ? 'success'
                      : tier.summary.lastStatus === 'error'
                        ? 'error'
                        : 'warning'
                  "
                  variant="soft"
                  size="sm"
                >
                  {{ tier.summary.lastStatus }}
                </UBadge>
                <span class="text-xs text-muted">
                  {{ tier.summary.lastEventCount }} events •
                  {{ timeAgo(tier.summary.lastRunAt) }}
                </span>
                <span v-if="tier.summary.totalRunsLast24h > 0" class="text-xs text-dimmed">
                  ({{ tier.summary.totalRunsLast24h }} runs in 24h)
                </span>
              </div>
              <p v-else class="text-xs text-dimmed">No runs recorded yet</p>

              <UPopover>
                <UButton
                  color="primary"
                  variant="soft"
                  size="sm"
                  icon="i-lucide-play"
                  :loading="actions.activeAction.value === `admin-ingest:${tier.key}`"
                  block
                >
                  Run now
                </UButton>
                <template #content>
                  <div class="p-3 space-y-2 max-w-xs">
                    <p class="text-sm font-semibold text-default">Trigger {{ tier.label }}?</p>
                    <p class="text-xs text-muted">
                      This will fetch {{ tier.description.toLowerCase() }} from ESPN and update the
                      event cache.
                    </p>
                    <div class="flex gap-2 justify-end">
                      <UButton
                        color="primary"
                        size="xs"
                        :loading="actions.activeAction.value === `admin-ingest:${tier.key}`"
                        @click="runIngest(tier.key)"
                      >
                        Confirm
                      </UButton>
                    </div>
                  </div>
                </template>
              </UPopover>
            </div>
          </UCard>

          <UCard class="napkinbets-panel border-dashed ring-0 bg-transparent">
            <div class="flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div
                class="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-dimmed"
              >
                <UIcon name="i-lucide-database-zap" class="w-5 h-5" />
              </div>
              <div class="space-y-1">
                <p class="font-semibold text-default">TheSportsDB Reference Sync</p>
                <p class="text-xs text-muted max-w-[200px]">
                  Sync league metadata and team assets from TheSportsDB.
                </p>
              </div>
              <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-info" disabled>
                Waiting for ingest logic
              </UButton>
            </div>
          </UCard>
        </div>

        <USeparator />

        <div class="space-y-2">
          <p class="font-semibold text-default">Recent runs</p>
          <div class="overflow-x-auto">
            <UTable :data="ingestRunRows" :columns="ingestRunColumns" />
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
