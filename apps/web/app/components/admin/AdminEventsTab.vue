<script setup lang="ts">
import { useNapkinbetsApi } from '../../services/napkinbets-api'
import type { NapkinbetsEventCard } from '../../../types/napkinbets'

const api = useNapkinbetsApi()

// Pagination & Search State
const page = ref(1)
const limit = ref(20)
const search = ref('')
const searchInput = ref('')
const total = ref(0)
const events = ref<NapkinbetsEventCard[]>([])
const isLoading = ref(false)

async function loadEvents() {
  isLoading.value = true
  try {
    const response = await api.getAdminEvents({
      page: page.value,
      limit: limit.value,
      search: search.value,
    })
    events.value = response.events
    total.value = response.pagination.total
  } catch (err) {
    console.error('Failed to load events', err)
    events.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

watch(
  [page, limit, search],
  () => {
    loadEvents()
  },
  { immediate: true },
)

function handleSearch() {
  page.value = 1
  search.value = searchInput.value
}

const columns = [
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'sport', header: 'Sport' },
  { accessorKey: 'league', header: 'League' },
  { accessorKey: 'eventTitle', header: 'Matchup' },
  { accessorKey: 'startTime', header: 'Starts' },
  { accessorKey: 'importanceScore', header: 'Score' },
  { accessorKey: 'importanceReason', header: 'AI Reason' },
]

function formatStartTime(isoString: string) {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const tableData = computed(() => {
  return events.value.map((e) => ({
    ...e,
    leagueDisplay: e.league.toUpperCase(),
    sportDisplay: e.sportLabel,
    startTimeDisplay: formatStartTime(e.startTime),
  }))
})
</script>

<template>
  <div class="space-y-4">
    <UCard class="napkinbets-panel">
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div class="space-y-2">
            <p class="napkinbets-kicker">Events</p>
            <h2 class="napkinbets-subsection-title">Manage ingested event coverage</h2>
          </div>

          <div class="flex items-center gap-2">
            <UInput
              v-model="searchInput"
              icon="i-lucide-search"
              placeholder="Search by title, sport, or league..."
              class="w-full"
              @keyup.enter="handleSearch"
            />
          </div>
        </div>

        <div class="overflow-x-auto">
          <UTable :data="tableData" :columns="columns" :loading="isLoading">
            <template #status-cell="{ row }">
              <UBadge
                :color="
                  row.original.state === 'in'
                    ? 'success'
                    : row.original.state === 'post'
                      ? 'neutral'
                      : 'info'
                "
                variant="subtle"
              >
                {{ row.original.shortStatus || row.original.status }}
              </UBadge>
            </template>
            <template #sport-cell="{ row }">
              <span class="text-sm text-muted capitalize">{{ row.original.sportDisplay }}</span>
            </template>
            <template #league-cell="{ row }">
              <UBadge v-if="row.original.league" color="warning" variant="soft">
                {{ row.original.leagueDisplay }}
              </UBadge>
              <span v-else class="text-muted">—</span>
            </template>
            <template #importanceScore-cell="{ row }">
              <div class="flex items-center gap-2">
                <span
                  class="font-mono text-sm font-medium"
                  :class="
                    row.original.importanceScore >= 40
                      ? 'text-primary'
                      : row.original.importanceScore >= 20
                        ? 'text-default'
                        : 'text-muted'
                  "
                >
                  {{ row.original.importanceScore }}
                </span>
              </div>
            </template>
            <template #importanceReason-cell="{ row }">
              <span
                class="text-xs text-muted max-w-[200px] truncate block"
                :title="row.original.importanceReason"
              >
                {{ row.original.importanceReason || '—' }}
              </span>
            </template>
            <template #startTime-cell="{ row }">
              <span class="text-sm text-muted whitespace-nowrap">{{
                row.original.startTimeDisplay
              }}</span>
            </template>
          </UTable>
        </div>

        <div class="flex justify-end p-2 border-t border-default">
          <UPagination v-model:page="page" :total="total" :items-per-page="limit" />
        </div>
      </div>
    </UCard>
  </div>
</template>
