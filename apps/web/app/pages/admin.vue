<script setup lang="ts">
import type { NapkinbetsAdminFeaturedBet, SaveFeaturedBetInput } from '../../types/napkinbets'

definePageMeta({ middleware: ['admin'] })

const adminState = await useNapkinbetsAdmin()
const actions = useNapkinbetsActions(adminState.refresh)
const admin = computed(() => adminState.data.value)
const api = useNapkinbetsApi()

const featuredBets = ref<NapkinbetsAdminFeaturedBet[]>([])
const showFeaturedForm = ref(false)
const editingFeaturedBet = ref<NapkinbetsAdminFeaturedBet | null>(null)
const featuredForm = ref<SaveFeaturedBetInput>({
  label: '',
  title: '',
  subtitle: '',
  summary: '',
  windowLabel: '',
  venueLabel: '',
  accent: 'tour',
  imageUrl: '',
  sortOrder: 0,
  isActive: true,
  prefillJson: '{}',
})

async function loadFeaturedBets() {
  try {
    const response = await api.getAdminFeaturedBets()
    featuredBets.value = response.featuredBets
  } catch {
    featuredBets.value = []
  }
}

await loadFeaturedBets()

function resetFeaturedForm() {
  editingFeaturedBet.value = null
  featuredForm.value = {
    label: '',
    title: '',
    subtitle: '',
    summary: '',
    windowLabel: '',
    venueLabel: '',
    accent: 'tour',
    imageUrl: '',
    sortOrder: 0,
    isActive: true,
    prefillJson: '{}',
  }
  showFeaturedForm.value = false
}

function editFeaturedBet(bet: NapkinbetsAdminFeaturedBet) {
  editingFeaturedBet.value = bet
  featuredForm.value = {
    id: bet.id,
    label: bet.label,
    title: bet.title,
    subtitle: bet.subtitle,
    summary: bet.summary,
    windowLabel: bet.windowLabel,
    venueLabel: bet.venueLabel,
    accent: bet.accent as 'major' | 'tour' | 'watch',
    imageUrl: bet.imageUrl,
    sortOrder: bet.sortOrder,
    isActive: bet.isActive,
    prefillJson: bet.prefillJson,
  }
  showFeaturedForm.value = true
}

async function saveFeaturedBet() {
  await actions.saveFeaturedBet(featuredForm.value)
  resetFeaturedForm()
  await loadFeaturedBets()
}

async function toggleFeaturedActive(bet: NapkinbetsAdminFeaturedBet) {
  await actions.saveFeaturedBet({
    id: bet.id,
    label: bet.label,
    title: bet.title,
    isActive: !bet.isActive,
  })
  await loadFeaturedBets()
}

async function removeFeaturedBet(id: string) {
  await actions.deleteFeaturedBet(id)
  await loadFeaturedBets()
}

async function toggleAdmin(userId: string, isAdmin: boolean) {
  await actions.setAdminStatus(userId, !isAdmin)
}

async function setStatus(wagerId: string, status: string) {
  await actions.setWagerStatus(wagerId, status)
}

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

async function updateAiSettings(
  key:
    | 'aiRecommendationsEnabled'
    | 'aiPropSuggestionsEnabled'
    | 'aiTermsAssistEnabled'
    | 'aiCloseoutAssistEnabled',
) {
  const current = admin.value.aiSettings
  await actions.saveAdminAiSettings({
    aiRecommendationsEnabled:
      key === 'aiRecommendationsEnabled'
        ? !current.aiRecommendationsEnabled
        : current.aiRecommendationsEnabled,
    aiPropSuggestionsEnabled:
      key === 'aiPropSuggestionsEnabled'
        ? !current.aiPropSuggestionsEnabled
        : current.aiPropSuggestionsEnabled,
    aiTermsAssistEnabled:
      key === 'aiTermsAssistEnabled' ? !current.aiTermsAssistEnabled : current.aiTermsAssistEnabled,
    aiCloseoutAssistEnabled:
      key === 'aiCloseoutAssistEnabled'
        ? !current.aiCloseoutAssistEnabled
        : current.aiCloseoutAssistEnabled,
  })
}

const aiControlRows = computed(() => [
  {
    key: 'aiRecommendationsEnabled' as const,
    label: 'Global AI assists',
    description: 'Master gate for any user-facing Grok help inside Napkinbets.',
    enabled: admin.value.aiSettings.aiRecommendationsEnabled,
  },
  {
    key: 'aiPropSuggestionsEnabled' as const,
    label: 'Prop suggestion assists',
    description:
      'Lets Events and create flows ask for grounded prop variants from live event context.',
    enabled: admin.value.aiSettings.aiPropSuggestionsEnabled,
  },
  {
    key: 'aiTermsAssistEnabled' as const,
    label: 'Terms rewrite assists',
    description:
      'Lets hosts tighten house rules and settle-up wording without changing the stake logic.',
    enabled: admin.value.aiSettings.aiTermsAssistEnabled,
  },
  {
    key: 'aiCloseoutAssistEnabled' as const,
    label: 'Closeout summary assists',
    description:
      'Lets owners generate a cleaner reconciliation summary once proof and outcomes are in.',
    enabled: admin.value.aiSettings.aiCloseoutAssistEnabled,
  },
])

useSeo({
  title: 'Admin bet controls',
  description:
    'Manage registered users, promote admins, refresh event coverage, and control operator-only features across Napkinbets.',
  ogImage: {
    title: 'Napkinbets Admin',
    description: 'User, event, and feature controls for the prototype.',
    icon: '🛡️',
  },
})

useWebPageSchema({
  name: 'Napkinbets Admin',
  description:
    'Administrative overview for users, event coverage, and feature controls in the Napkinbets prototype.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="space-y-4">
        <p class="napkinbets-kicker">Admin</p>
        <h1 class="napkinbets-section-title">Run the product, not just the bets.</h1>
        <p class="napkinbets-hero-lede">
          This route covers users, bet states, event coverage health, and operator-controlled AI
          toggles so the product stays explicit.
        </p>
      </div>
    </div>

    <UAlert
      v-if="actions.feedback.value"
      :color="actions.feedback.value.type === 'success' ? 'success' : 'error'"
      variant="soft"
      :icon="
        actions.feedback.value.type === 'success'
          ? 'i-lucide-check-circle-2'
          : 'i-lucide-circle-alert'
      "
      :title="
        actions.feedback.value.type === 'success' ? 'Admin update applied' : 'Admin action failed'
      "
      :description="actions.feedback.value.text"
    />

    <div class="napkinbets-metric-grid">
      <NapkinbetsMetricCard v-for="metric in admin.metrics" :key="metric.label" :metric="metric" />
    </div>

    <div class="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <div class="space-y-4">
        <UCard class="napkinbets-panel">
          <div class="space-y-4">
            <div class="space-y-2">
              <p class="napkinbets-kicker">Operations</p>
              <h2 class="napkinbets-subsection-title">Event coverage and ingest health</h2>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <UCard
                v-for="tier in tierCards"
                :key="tier.key"
                class="napkinbets-panel"
              >
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
                      :color="tier.summary.lastStatus === 'success' ? 'success' : tier.summary.lastStatus === 'error' ? 'error' : 'warning'"
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
                          This will fetch {{ tier.description.toLowerCase() }} from ESPN and update
                          the event cache.
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
            </div>

            <USeparator />

            <div class="space-y-2">
              <p class="font-semibold text-default">Recent runs</p>
              <div class="overflow-x-auto">
                <UTable
                  :data="ingestRunRows"
                  :columns="ingestRunColumns"
                />
              </div>
            </div>
          </div>
        </UCard>

        <UCard class="napkinbets-panel">
          <div class="space-y-4">
            <div class="space-y-2">
              <p class="napkinbets-kicker">AI controls</p>
              <h2 class="napkinbets-subsection-title">Transparent, operator-controlled assists</h2>
            </div>

            <UAlert
              :color="admin.aiSettings.xaiConfigured ? 'success' : 'warning'"
              variant="soft"
              :icon="admin.aiSettings.xaiConfigured ? 'i-lucide-bot' : 'i-lucide-key-round'"
              :title="
                admin.aiSettings.xaiConfigured
                  ? 'Grok provider configured'
                  : 'XAI_API_KEY not configured'
              "
              :description="
                admin.aiSettings.xaiConfigured
                  ? 'UI flags can safely control what becomes visible to users.'
                  : 'Keep all AI flags off until the provider key is available in Doppler.'
              "
            />

            <div class="space-y-3">
              <div v-for="control in aiControlRows" :key="control.key" class="napkinbets-note-row">
                <div class="space-y-1">
                  <p class="font-semibold text-default">{{ control.label }}</p>
                  <p class="text-sm text-muted">{{ control.description }}</p>
                </div>

                <UButton
                  :color="control.enabled ? 'success' : 'neutral'"
                  variant="soft"
                  :loading="actions.activeAction.value === 'admin-ai-settings'"
                  @click="updateAiSettings(control.key)"
                >
                  {{ control.enabled ? 'Enabled' : 'Disabled' }}
                </UButton>
              </div>
            </div>
          </div>
        </UCard>

        <UCard class="napkinbets-panel">
          <div class="space-y-4">
            <div class="flex items-end justify-between gap-3">
              <div class="space-y-2">
                <p class="napkinbets-kicker">Featured bets</p>
                <h2 class="napkinbets-subsection-title">Manage events page featured cards</h2>
              </div>

              <UButton
                color="primary"
                variant="soft"
                size="sm"
                icon="i-lucide-plus"
                @click="resetFeaturedForm(); showFeaturedForm = true"
              >
                Add
              </UButton>
            </div>

            <div v-if="showFeaturedForm" class="space-y-3 rounded-lg bg-elevated p-4">
              <p class="font-semibold text-default">
                {{ editingFeaturedBet ? 'Edit featured bet' : 'New featured bet' }}
              </p>

              <div class="grid gap-3 sm:grid-cols-2">
                <UInput v-model="featuredForm.label" placeholder="Label (e.g. Major watch)" class="w-full" />
                <UInput v-model="featuredForm.title" placeholder="Title" class="w-full" />
                <UInput v-model="featuredForm.subtitle" placeholder="Subtitle" class="w-full" />
                <UInput v-model="featuredForm.windowLabel" placeholder="Window label (e.g. Apr 6-12)" class="w-full" />
                <UInput v-model="featuredForm.venueLabel" placeholder="Venue label" class="w-full" />
                <UInput v-model="featuredForm.imageUrl" placeholder="Image URL" class="w-full" />
                <USelect
                  v-model="featuredForm.accent"
                  :items="[{ label: 'Major', value: 'major' }, { label: 'Tour', value: 'tour' }, { label: 'Watch', value: 'watch' }]"
                  class="w-full"
                />
                <UInput v-model.number="featuredForm.sortOrder" type="number" placeholder="Sort order" class="w-full" />
              </div>

              <UTextarea v-model="featuredForm.summary" placeholder="Summary" class="w-full" :rows="2" />
              <UTextarea v-model="featuredForm.prefillJson" placeholder="Prefill JSON" class="w-full" :rows="3" />

              <div class="flex gap-2">
                <UButton
                  color="primary"
                  size="sm"
                  :loading="actions.activeAction.value === 'featured-bet:save'"
                  @click="saveFeaturedBet"
                >
                  {{ editingFeaturedBet ? 'Update' : 'Create' }}
                </UButton>
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  @click="resetFeaturedForm"
                >
                  Cancel
                </UButton>
              </div>
            </div>

            <div v-if="featuredBets.length === 0 && !showFeaturedForm" class="text-sm text-muted">
              No featured bets configured. Auto-generated spotlights will be used.
            </div>

            <div class="space-y-3">
              <div v-for="bet in featuredBets" :key="bet.id" class="napkinbets-note-row">
                <div class="space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <UBadge :color="bet.isActive ? 'success' : 'neutral'" variant="soft" size="sm">
                      {{ bet.isActive ? 'Active' : 'Inactive' }}
                    </UBadge>
                    <UBadge color="warning" variant="soft" size="sm">
                      {{ bet.accent }}
                    </UBadge>
                    <span v-if="bet.windowLabel" class="text-xs text-muted">{{ bet.windowLabel }}</span>
                  </div>
                  <p class="font-semibold text-default">{{ bet.title }}</p>
                  <p class="text-sm text-muted">{{ bet.subtitle || bet.summary || 'No description' }}</p>
                </div>

                <div class="flex gap-2 shrink-0">
                  <UButton
                    :color="bet.isActive ? 'neutral' : 'success'"
                    variant="soft"
                    size="sm"
                    :icon="bet.isActive ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    @click="toggleFeaturedActive(bet)"
                  >
                    {{ bet.isActive ? 'Deactivate' : 'Activate' }}
                  </UButton>
                  <UButton
                    color="neutral"
                    variant="soft"
                    size="sm"
                    icon="i-lucide-pencil"
                    @click="editFeaturedBet(bet)"
                  >
                    Edit
                  </UButton>
                  <UButton
                    color="error"
                    variant="soft"
                    size="sm"
                    icon="i-lucide-trash-2"
                    @click="removeFeaturedBet(bet.id)"
                  >
                    Delete
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <div class="space-y-4">
        <UCard class="napkinbets-panel">
          <div class="space-y-4">
            <div class="space-y-2">
              <p class="napkinbets-kicker">Users</p>
              <h2 class="napkinbets-subsection-title">Registration and admin roles</h2>
            </div>

            <div class="space-y-3">
              <div v-for="adminUser in admin.users" :key="adminUser.id" class="napkinbets-note-row">
                <div>
                  <p class="font-semibold text-default">{{ adminUser.name || adminUser.email }}</p>
                  <p class="text-sm text-muted">
                    {{ adminUser.email }} • {{ adminUser.ownedWagerCount }} owned •
                    {{ adminUser.joinedWagerCount }} joined
                  </p>
                </div>

                <UButton
                  color="neutral"
                  variant="soft"
                  :icon="adminUser.isAdmin ? 'i-lucide-shield-off' : 'i-lucide-shield-check'"
                  :loading="actions.activeAction.value === `admin-role:${adminUser.id}`"
                  @click="toggleAdmin(adminUser.id, adminUser.isAdmin)"
                >
                  {{ adminUser.isAdmin ? 'Remove admin' : 'Make admin' }}
                </UButton>
              </div>
            </div>
          </div>
        </UCard>

        <UCard class="napkinbets-panel">
          <div class="space-y-4">
            <div class="space-y-2">
              <p class="napkinbets-kicker">Bets</p>
              <h2 class="napkinbets-subsection-title">Bet status management</h2>
            </div>

            <div class="space-y-4">
              <div v-for="wager in admin.wagers" :key="wager.id" class="napkinbets-admin-board">
                <div class="space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <UBadge color="neutral" variant="subtle">{{ wager.status }}</UBadge>
                    <UBadge v-if="wager.league" color="warning" variant="soft">{{
                      wager.league.toUpperCase()
                    }}</UBadge>
                  </div>
                  <p class="font-semibold text-default">{{ wager.title }}</p>
                  <p class="text-sm text-muted">
                    {{ wager.ownerEmail || wager.creatorName }} •
                    {{ wager.participantCount }} participants • {{ wager.openSettlementCount }} open
                    settlements
                  </p>
                </div>

                <div class="napkinbets-card-actions">
                  <UButton
                    color="success"
                    variant="soft"
                    size="sm"
                    :loading="actions.activeAction.value === `admin-status:${wager.id}`"
                    @click="setStatus(wager.id, 'live')"
                  >
                    Set live
                  </UButton>
                  <UButton
                    color="warning"
                    variant="soft"
                    size="sm"
                    :loading="actions.activeAction.value === `admin-status:${wager.id}`"
                    @click="setStatus(wager.id, 'settling')"
                  >
                    Set settling
                  </UButton>
                  <UButton
                    color="neutral"
                    variant="soft"
                    size="sm"
                    :loading="actions.activeAction.value === `admin-status:${wager.id}`"
                    @click="setStatus(wager.id, 'archived')"
                  >
                    Archive
                  </UButton>
                  <UButton
                    :to="`/napkins/${wager.slug}`"
                    color="primary"
                    variant="soft"
                    size="sm"
                    icon="i-lucide-arrow-right"
                  >
                    Open bet
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
