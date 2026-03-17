<script setup lang="ts">
import { useNapkinbetsApi } from '../../../services/napkinbets-api'
import type { NapkinbetsAdminLeagueViewerResponse } from '../../../../types/napkinbets'

definePageMeta({ middleware: ['admin'] })

const route = useRoute()
const leagueKey = route.params.league as string

const api = useNapkinbetsApi()
const { data, pending, error, refresh } = await useAsyncData<NapkinbetsAdminLeagueViewerResponse>(
  `admin-taxonomy-league-${leagueKey}`,
  () => api.getAdminLeagueViewer(leagueKey),
)

useSeo({
  title: `League Viewer - ${leagueKey}`,
  description: 'View synchronized entities and teams for this league.',
})

useWebPageSchema({
  name: `League Viewer - ${leagueKey}`,
  description: 'View synchronized entities and teams for this league.',
})

useWebPageSchema({
  name: `League Viewer - ${leagueKey}`,
  description: 'View and sync detailed entities for a configured league.',
})

function getSyncStatusColor(status?: string | null) {
  switch (status) {
    case 'success':
      return 'success'
    case 'partial':
      return 'warning'
    case 'error':
      return 'error'
    default:
      return 'neutral'
  }
}

const actions = useNapkinbetsActions(async () => {
  await refresh()
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="mb-4">
      <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-arrow-left" to="/admin">
        Back to Admin
      </UButton>
    </div>

    <div v-if="pending" class="flex justify-center p-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
    </div>

    <div v-else-if="error || !data" class="space-y-4">
      <UAlert
        color="error"
        variant="soft"
        icon="i-lucide-circle-alert"
        title="Could not load league"
        :description="error?.message || 'Unknown error'"
      />
    </div>

    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="space-y-4">
        <h1 class="napkinbets-section-title">{{ data.league.label }}</h1>
        <div class="flex flex-wrap items-center gap-2">
          <UBadge color="warning" variant="soft" size="sm">
            {{ data.league.key }}
          </UBadge>
          <UBadge color="neutral" variant="subtle" size="sm">
            {{ data.league.provider }}
          </UBadge>
          <UBadge
            :color="data.league.entityProvider === 'api-sports' ? 'primary' : 'neutral'"
            variant="subtle"
            size="sm"
          >
            {{ data.league.entityProvider || 'manual' }}
          </UBadge>
          <UBadge
            v-if="data.league.entityLastSyncStatus"
            :color="getSyncStatusColor(data.league.entityLastSyncStatus)"
            variant="soft"
            size="sm"
          >
            {{ data.league.entityLastSyncStatus }}
          </UBadge>
        </div>
        <p class="text-muted">
          {{ data.league.sportLabel || data.league.sportKey }} •
          {{ data.league.primaryContextLabel || data.league.primaryContextKey }}
          <template v-if="data.league.entityProviderLeagueId">
            • Provider ID: {{ data.league.entityProviderLeagueId }}
          </template>
        </p>

        <div class="flex gap-2">
          <UButton
            color="primary"
            variant="soft"
            icon="i-lucide-refresh-cw"
            :loading="
              actions.activeAction.value === `admin-taxonomy-league:sync:${data.league.key}`
            "
            @click="actions.syncAdminTaxonomyLeague(data.league.key)"
          >
            Run Sync
          </UButton>
        </div>
      </div>

      <!-- Entity Counts -->
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <UCard class="napkinbets-panel">
          <div class="space-y-1">
            <p class="napkinbets-kicker">Teams</p>
            <p class="text-2xl font-semibold text-default">{{ data.entityCounts.teams }}</p>
          </div>
        </UCard>
        <UCard class="napkinbets-panel">
          <div class="space-y-1">
            <p class="napkinbets-kicker">Players</p>
            <p class="text-2xl font-semibold text-default">{{ data.entityCounts.players }}</p>
          </div>
        </UCard>
        <UCard class="napkinbets-panel">
          <div class="space-y-1">
            <p class="napkinbets-kicker">Venues</p>
            <p class="text-2xl font-semibold text-default">{{ data.entityCounts.venues }}</p>
          </div>
        </UCard>
        <UCard class="napkinbets-panel">
          <div class="space-y-1">
            <p class="napkinbets-kicker">Roster rows</p>
            <p class="text-2xl font-semibold text-default">{{ data.entityCounts.rosters }}</p>
          </div>
        </UCard>
      </div>

      <!-- Config detail -->
      <UCard class="napkinbets-panel">
        <h2 class="napkinbets-subsection-title mb-4">Configuration details</h2>
        <div class="space-y-2 text-sm">
          <div v-if="data.league.entityLastSyncMessage">
            <span class="font-medium text-default">Sync Message:</span>
            <span class="ml-2 text-muted">{{ data.league.entityLastSyncMessage }}</span>
          </div>
          <div v-if="data.league.entityResolvedSeason">
            <span class="font-medium text-default">Resolved Season:</span>
            <span class="ml-2 text-muted">{{ data.league.entityResolvedSeason }}</span>
          </div>
          <div>
            <span class="font-medium text-default">Active Months:</span>
            <span class="ml-2 text-muted">{{ data.league.activeMonths.join(', ') || 'None' }}</span>
          </div>
          <div>
            <span class="font-medium text-default">Toggles:</span>
            <span class="ml-2 text-muted">
              Entity Sync ({{ data.league.entitySyncEnabled ? 'Yes' : 'No' }}), Score Sync ({{
                data.league.scoreSyncEnabled ? 'Yes' : 'No'
              }}), Event Discovery ({{ data.league.supportsEventDiscovery ? 'Yes' : 'No' }})
            </span>
          </div>
        </div>
      </UCard>

      <!-- Sync Teams List -->
      <UCard class="napkinbets-panel">
        <div class="space-y-4">
          <h2 class="napkinbets-subsection-title">Synced Teams ({{ data.teams.length }})</h2>
          <div v-if="data.teams.length > 0" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="team in data.teams"
              :key="team.id"
              class="flex items-center gap-3 rounded-lg border border-default p-3"
            >
              <UAvatar
                v-if="team.logoUrl"
                :src="team.logoUrl"
                :alt="team.name"
                size="sm"
                class="bg-white p-0.5"
                :ui="{ fallback: 'hidden' }"
              />
              <UIcon v-else name="i-lucide-shield" class="size-6 text-muted" />
              <div class="min-w-0 flex-1">
                <p class="truncate font-semibold text-default">{{ team.name }}</p>
                <p class="truncate text-xs text-muted">
                  {{ team.abbreviation }}
                  <template v-if="team.city && team.abbreviation">•</template>
                  {{ team.city }}
                </p>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-dimmed">No teams synchronized for this league.</p>
        </div>
      </UCard>
    </div>
  </div>
</template>
