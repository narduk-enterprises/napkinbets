<script setup lang="ts">
import type {
  NapkinbetsAdminTaxonomyLeague,
  SaveNapkinbetsTaxonomyLeagueInput,
} from '../../../types/napkinbets'

const taxonomyState = await useNapkinbetsAdminTaxonomy()
const actions = useNapkinbetsActions(taxonomyState.refresh)
const taxonomy = computed(() => taxonomyState.data.value)

const showForm = ref(false)
const editingLeagueKey = ref<string | null>(null)
const formError = ref('')
const formState = reactive({
  key: '',
  label: '',
  sportKey: '',
  primaryContextKey: '',
  contextKeysCsv: '',
  provider: 'manual' as 'espn' | 'manual',
  providerLeagueKey: '',
  entityProvider: 'manual' as 'manual' | 'api-sports',
  entityProviderSportKey: '',
  entityProviderLeagueId: '',
  entityProviderSeason: '',
  entitySyncEnabled: false,
  scoreSyncEnabled: false,
  scoreboardQueryParamsJson: '{}',
  eventShape: '' as '' | 'head-to-head' | 'tournament',
  activeMonthsCsv: '',
  supportsDateWindow: true,
  supportsEventDiscovery: false,
  sortOrder: 0,
  isActive: true,
})

function resetForm() {
  editingLeagueKey.value = null
  formError.value = ''
  Object.assign(formState, {
    key: '',
    label: '',
    sportKey: taxonomy.value.sports[0]?.key ?? '',
    primaryContextKey: taxonomy.value.contexts[0]?.key ?? '',
    contextKeysCsv: '',
    provider: 'manual',
    providerLeagueKey: '',
    entityProvider: 'manual',
    entityProviderSportKey: '',
    entityProviderLeagueId: '',
    entityProviderSeason: '',
    entitySyncEnabled: false,
    scoreSyncEnabled: false,
    scoreboardQueryParamsJson: '{}',
    eventShape: '',
    activeMonthsCsv: '',
    supportsDateWindow: true,
    supportsEventDiscovery: false,
    sortOrder: 0,
    isActive: true,
  })
  showForm.value = false
}

function fillForm(league: NapkinbetsAdminTaxonomyLeague) {
  editingLeagueKey.value = league.key
  formError.value = ''
  Object.assign(formState, {
    key: league.key,
    label: league.label,
    sportKey: league.sportKey,
    primaryContextKey: league.primaryContextKey,
    contextKeysCsv: league.contextKeys.join(', '),
    provider: league.provider,
    providerLeagueKey: league.providerLeagueKey ?? '',
    entityProvider: league.entityProvider ?? 'manual',
    entityProviderSportKey: league.entityProviderSportKey ?? '',
    entityProviderLeagueId: league.entityProviderLeagueId ?? '',
    entityProviderSeason: league.entityProviderSeason ?? '',
    entitySyncEnabled: Boolean(league.entitySyncEnabled),
    scoreSyncEnabled: Boolean(league.scoreSyncEnabled),
    scoreboardQueryParamsJson: JSON.stringify(league.scoreboardQueryParams ?? {}, null, 2),
    eventShape: league.eventShape ?? '',
    activeMonthsCsv: league.activeMonths.join(', '),
    supportsDateWindow: league.supportsDateWindow !== false,
    supportsEventDiscovery: league.supportsEventDiscovery,
    sortOrder: league.sortOrder ?? 0,
    isActive: league.isActive !== false,
  })
  showForm.value = true
}

function createLeague() {
  resetForm()
  showForm.value = true
}

function parseCsv(value: string) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function syncStatusColor(status: NapkinbetsAdminTaxonomyLeague['entityLastSyncStatus']) {
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

async function saveLeague() {
  formError.value = ''

  let scoreboardQueryParams: Record<string, string> = {}
  try {
    scoreboardQueryParams = JSON.parse(formState.scoreboardQueryParamsJson || '{}') as Record<
      string,
      string
    >
  } catch {
    formError.value = 'Scoreboard params must be valid JSON.'
    return
  }

  const activeMonths = parseCsv(formState.activeMonthsCsv)
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 12)

  const payload: SaveNapkinbetsTaxonomyLeagueInput = {
    key: formState.key.trim(),
    label: formState.label.trim(),
    sportKey: formState.sportKey,
    primaryContextKey: formState.primaryContextKey,
    contextKeys: parseCsv(formState.contextKeysCsv),
    provider: formState.provider,
    providerLeagueKey: formState.providerLeagueKey.trim() || undefined,
    entityProvider: formState.entityProvider,
    entityProviderSportKey: formState.entityProviderSportKey
      ? (formState.entityProviderSportKey as SaveNapkinbetsTaxonomyLeagueInput['entityProviderSportKey'])
      : undefined,
    entityProviderLeagueId: formState.entityProviderLeagueId.trim() || undefined,
    entityProviderSeason: formState.entityProviderSeason.trim() || undefined,
    entitySyncEnabled: formState.entitySyncEnabled,
    scoreSyncEnabled: formState.scoreSyncEnabled,
    scoreboardQueryParams,
    eventShape: formState.eventShape || null,
    activeMonths,
    supportsDateWindow: formState.supportsDateWindow,
    supportsEventDiscovery: formState.supportsEventDiscovery,
    sortOrder: formState.sortOrder,
    isActive: formState.isActive,
  }

  if (!payload.key || !payload.label || !payload.sportKey || !payload.primaryContextKey) {
    formError.value = 'Key, label, sport, and primary context are required.'
    return
  }

  if (payload.contextKeys.length === 0) {
    formError.value = 'Add at least one context key.'
    return
  }

  const result = await actions.saveAdminTaxonomyLeague(payload)
  if (result) {
    resetForm()
  }
}

async function syncLeague(key: string) {
  await actions.syncAdminTaxonomyLeague(key)
}
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <UCard class="napkinbets-panel">
        <div class="space-y-1">
          <p class="napkinbets-kicker">Teams</p>
          <p class="text-2xl font-semibold text-default">{{ taxonomy.entityCounts.teams }}</p>
        </div>
      </UCard>
      <UCard class="napkinbets-panel">
        <div class="space-y-1">
          <p class="napkinbets-kicker">Players</p>
          <p class="text-2xl font-semibold text-default">{{ taxonomy.entityCounts.players }}</p>
        </div>
      </UCard>
      <UCard class="napkinbets-panel">
        <div class="space-y-1">
          <p class="napkinbets-kicker">Venues</p>
          <p class="text-2xl font-semibold text-default">{{ taxonomy.entityCounts.venues }}</p>
        </div>
      </UCard>
      <UCard class="napkinbets-panel">
        <div class="space-y-1">
          <p class="napkinbets-kicker">Roster rows</p>
          <p class="text-2xl font-semibold text-default">{{ taxonomy.entityCounts.rosters }}</p>
        </div>
      </UCard>
    </div>

    <UCard class="napkinbets-panel">
      <div class="space-y-4">
        <div class="flex items-end justify-between gap-3">
          <div class="space-y-2">
            <p class="napkinbets-kicker">Taxonomy</p>
            <h2 class="napkinbets-subsection-title">Manage league source config</h2>
          </div>

          <UButton
            color="primary"
            variant="soft"
            size="sm"
            icon="i-lucide-plus"
            @click="createLeague"
          >
            New league
          </UButton>
        </div>

        <UAlert
          v-if="formError"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          title="Form error"
          :description="formError"
        />

        <div v-if="showForm" class="space-y-3 rounded-lg bg-elevated p-4">
          <p class="font-semibold text-default">
            {{ editingLeagueKey ? `Edit ${editingLeagueKey}` : 'Create league' }}
          </p>

          <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <UInput v-model="formState.key" placeholder="League key" class="w-full" />
            <UInput v-model="formState.label" placeholder="League label" class="w-full" />
            <USelect
              v-model="formState.sportKey"
              :items="taxonomy.sports.map((sport) => ({ label: sport.label, value: sport.key }))"
              class="w-full"
            />
            <USelect
              v-model="formState.primaryContextKey"
              :items="
                taxonomy.contexts.map((context) => ({ label: context.label, value: context.key }))
              "
              class="w-full"
            />
            <UInput
              v-model="formState.contextKeysCsv"
              placeholder="Context keys (comma separated)"
              class="w-full"
            />
            <USelect
              v-model="formState.provider"
              :items="[
                { label: 'ESPN', value: 'espn' },
                { label: 'Manual', value: 'manual' },
              ]"
              class="w-full"
            />
            <UInput
              v-model="formState.providerLeagueKey"
              placeholder="Event provider league key"
              class="w-full"
            />
            <USelect
              v-model="formState.entityProvider"
              :items="[
                { label: 'Manual', value: 'manual' },
                { label: 'API-Sports', value: 'api-sports' },
              ]"
              class="w-full"
            />
            <USelect
              v-model="formState.entityProviderSportKey"
              :items="[
                { label: 'American Football', value: 'american-football' },
                { label: 'Baseball', value: 'baseball' },
                { label: 'Basketball', value: 'basketball' },
                { label: 'Football', value: 'football' },
                { label: 'Hockey', value: 'hockey' },
              ]"
              class="w-full"
            />
            <UInput
              v-model="formState.entityProviderLeagueId"
              placeholder="API-Sports league ID"
              class="w-full"
            />
            <UInput
              v-model="formState.entityProviderSeason"
              placeholder="Preferred season"
              class="w-full"
            />
            <UInput
              v-model="formState.activeMonthsCsv"
              placeholder="Active months (1, 2, 3)"
              class="w-full"
            />
            <USelect
              v-model="formState.eventShape"
              :items="[
                { label: 'Head to Head', value: 'head-to-head' },
                { label: 'Tournament', value: 'tournament' },
                { label: 'Not set', value: '' },
              ]"
              class="w-full"
            />
            <UInput
              v-model.number="formState.sortOrder"
              type="number"
              placeholder="Sort order"
              class="w-full"
            />
          </div>

          <UTextarea
            v-model="formState.scoreboardQueryParamsJson"
            class="w-full"
            :rows="4"
            placeholder='{"groups":"50"}'
          />

          <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <UCheckbox v-model="formState.entitySyncEnabled" label="Entity sync enabled" />
            <UCheckbox v-model="formState.scoreSyncEnabled" label="Score sync enabled" />
            <UCheckbox v-model="formState.supportsDateWindow" label="Supports date windows" />
            <UCheckbox v-model="formState.supportsEventDiscovery" label="Event discovery enabled" />
            <UCheckbox v-model="formState.isActive" label="League active" />
          </div>

          <div class="flex gap-2">
            <UButton
              color="primary"
              size="sm"
              :loading="actions.activeAction.value === 'admin-taxonomy-league:save'"
              @click="saveLeague"
            >
              {{ editingLeagueKey ? 'Update league' : 'Create league' }}
            </UButton>
            <UButton color="neutral" variant="ghost" size="sm" @click="resetForm">Cancel</UButton>
          </div>
        </div>

        <div class="space-y-3">
          <div v-for="league in taxonomy.leagues" :key="league.key" class="napkinbets-note-row">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <UBadge
                  :color="league.isActive === false ? 'neutral' : 'success'"
                  variant="soft"
                  size="sm"
                >
                  {{ league.isActive === false ? 'Inactive' : 'Active' }}
                </UBadge>
                <UBadge color="warning" variant="soft" size="sm">
                  {{ league.key }}
                </UBadge>
                <UBadge color="neutral" variant="subtle" size="sm">
                  {{ league.provider }}
                </UBadge>
                <UBadge
                  :color="league.entityProvider === 'api-sports' ? 'primary' : 'neutral'"
                  variant="subtle"
                  size="sm"
                >
                  {{ league.entityProvider || 'manual' }}
                </UBadge>
                <UBadge
                  v-if="league.entityLastSyncStatus"
                  :color="syncStatusColor(league.entityLastSyncStatus)"
                  variant="soft"
                  size="sm"
                >
                  {{ league.entityLastSyncStatus }}
                </UBadge>
              </div>
              <p class="font-semibold text-default">{{ league.label }}</p>
              <p class="text-sm text-muted">
                {{ league.sportLabel || league.sportKey }} •
                {{ league.primaryContextLabel || league.primaryContextKey }}
                <template v-if="league.entityProviderLeagueId">
                  • Source ID {{ league.entityProviderLeagueId }}
                </template>
                <template v-if="league.entityResolvedSeason">
                  • Season {{ league.entityResolvedSeason }}
                </template>
              </p>
              <p v-if="league.entityLastSyncMessage" class="text-xs text-dimmed">
                {{ league.entityLastSyncMessage }}
              </p>
            </div>

            <div class="flex gap-2 shrink-0">
              <UButton
                color="neutral"
                variant="soft"
                size="sm"
                icon="i-lucide-eye"
                :to="`/admin/taxonomy/${league.key}`"
              >
                Inspect
              </UButton>
              <UButton
                color="primary"
                variant="soft"
                size="sm"
                icon="i-lucide-refresh-cw"
                :loading="actions.activeAction.value === `admin-taxonomy-league:sync:${league.key}`"
                @click="syncLeague(league.key)"
              >
                Sync
              </UButton>
              <UButton
                color="neutral"
                variant="soft"
                size="sm"
                icon="i-lucide-pencil"
                @click="fillForm(league)"
              >
                Edit
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
