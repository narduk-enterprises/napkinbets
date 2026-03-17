<script setup lang="ts">
definePageMeta({ middleware: ['admin'] })

const adminState = await useNapkinbetsAdmin()
const actions = useNapkinbetsActions(adminState.refresh)
const admin = computed(() => adminState.data.value)

function formatTimestamp(value: string | null) {
  if (!value) {
    return 'Pending'
  }

  return value.replace('T', ' ').replace('Z', ' UTC')
}

async function toggleAdmin(userId: string, isAdmin: boolean) {
  await actions.setAdminStatus(userId, !isAdmin)
}

async function setStatus(wagerId: string, status: string) {
  await actions.setWagerStatus(wagerId, status)
}

async function runIngest(tier: 'live-window' | 'next-48h' | 'next-7d') {
  await actions.runAdminIngest(tier)
}

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
    description: 'Lets discovery and create flows ask for grounded prop variants from cached event context.',
    enabled: admin.value.aiSettings.aiPropSuggestionsEnabled,
  },
  {
    key: 'aiTermsAssistEnabled' as const,
    label: 'Terms rewrite assists',
    description: 'Lets board owners tighten house rules and settlement wording without changing the stake logic.',
    enabled: admin.value.aiSettings.aiTermsAssistEnabled,
  },
  {
    key: 'aiCloseoutAssistEnabled' as const,
    label: 'Closeout summary assists',
    description: 'Lets owners generate a cleaner reconciliation summary once proof and outcomes are in.',
    enabled: admin.value.aiSettings.aiCloseoutAssistEnabled,
  },
])

useSeo({
  title: 'Admin board controls',
  description:
    'Manage registered users, promote admins, refresh event ingestion, and control operator-only features across Napkinbets.',
  ogImage: {
    title: 'Napkinbets Admin',
    description: 'User, cache, and feature controls for the prototype.',
    icon: '🛡️',
  },
})

useWebPageSchema({
  name: 'Napkinbets Admin',
  description:
    'Administrative overview for users, event ingestion, and feature controls in the Napkinbets prototype.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="space-y-4">
        <p class="napkinbets-kicker">Admin</p>
        <h1 class="napkinbets-section-title">Run the prototype, not just the boards.</h1>
        <p class="napkinbets-hero-lede">
          This route now covers users, wager states, cached event health, and operator-controlled AI toggles so product behavior stays explicit.
        </p>
      </div>
    </div>

    <UAlert
      v-if="actions.feedback.value"
      :color="actions.feedback.value.type === 'success' ? 'success' : 'error'"
      variant="soft"
      :icon="actions.feedback.value.type === 'success' ? 'i-lucide-check-circle-2' : 'i-lucide-circle-alert'"
      :title="actions.feedback.value.type === 'success' ? 'Admin update applied' : 'Admin action failed'"
      :description="actions.feedback.value.text"
    />

    <div class="napkinbets-metric-grid">
      <NapkinbetsMetricCard
        v-for="metric in admin.metrics"
        :key="metric.label"
        :metric="metric"
      />
    </div>

    <div class="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <div class="space-y-4">
        <UCard class="napkinbets-panel">
          <div class="space-y-4">
            <div class="space-y-2">
              <p class="napkinbets-kicker">Operations</p>
              <h2 class="napkinbets-subsection-title">Event cache and ingest health</h2>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <UButton
                color="primary"
                variant="soft"
                :loading="actions.activeAction.value === 'admin-ingest:live-window'"
                @click="runIngest('live-window')"
              >
                Refresh live window
              </UButton>
              <UButton
                color="neutral"
                variant="soft"
                :loading="actions.activeAction.value === 'admin-ingest:next-48h'"
                @click="runIngest('next-48h')"
              >
                Refresh next 48h
              </UButton>
              <UButton
                color="neutral"
                variant="soft"
                :loading="actions.activeAction.value === 'admin-ingest:next-7d'"
                @click="runIngest('next-7d')"
              >
                Refresh next 7d
              </UButton>
            </div>

            <div class="space-y-3">
              <div
                v-for="run in admin.ingestRuns"
                :key="run.id"
                class="napkinbets-note-row"
              >
                <div class="space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <UBadge
                      :color="run.status === 'success' ? 'success' : 'warning'"
                      variant="soft"
                    >
                      {{ run.status }}
                    </UBadge>
                    <UBadge color="neutral" variant="subtle">{{ run.tier }}</UBadge>
                    <UBadge color="warning" variant="soft">{{ run.league.toUpperCase() }}</UBadge>
                  </div>
                  <p class="text-sm text-muted">
                    {{ run.eventCount }} events • started {{ formatTimestamp(run.startedAt) }}
                  </p>
                  <p v-if="run.errorMessage" class="text-sm text-error">
                    {{ run.errorMessage }}
                  </p>
                </div>

                <p class="text-sm text-muted">{{ formatTimestamp(run.completedAt) }}</p>
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
              :title="admin.aiSettings.xaiConfigured ? 'Grok provider configured' : 'XAI_API_KEY not configured'"
              :description="admin.aiSettings.xaiConfigured ? 'UI flags can safely control what becomes visible to users.' : 'Keep all AI flags off until the provider key is available in Doppler.'"
            />

            <div class="space-y-3">
              <div
                v-for="control in aiControlRows"
                :key="control.key"
                class="napkinbets-note-row"
              >
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
      </div>

      <div class="space-y-4">
        <UCard class="napkinbets-panel">
          <div class="space-y-4">
            <div class="space-y-2">
              <p class="napkinbets-kicker">Users</p>
              <h2 class="napkinbets-subsection-title">Registration and admin roles</h2>
            </div>

            <div class="space-y-3">
              <div
                v-for="adminUser in admin.users"
                :key="adminUser.id"
                class="napkinbets-note-row"
              >
                <div>
                  <p class="font-semibold text-default">{{ adminUser.name || adminUser.email }}</p>
                  <p class="text-sm text-muted">
                    {{ adminUser.email }} • {{ adminUser.ownedWagerCount }} owned • {{ adminUser.joinedWagerCount }} joined
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
              <p class="napkinbets-kicker">Boards</p>
              <h2 class="napkinbets-subsection-title">Status management</h2>
            </div>

            <div class="space-y-4">
              <div
                v-for="wager in admin.wagers"
                :key="wager.id"
                class="napkinbets-admin-board"
              >
                <div class="space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <UBadge color="neutral" variant="subtle">{{ wager.status }}</UBadge>
                    <UBadge v-if="wager.league" color="warning" variant="soft">{{ wager.league.toUpperCase() }}</UBadge>
                  </div>
                  <p class="font-semibold text-default">{{ wager.title }}</p>
                  <p class="text-sm text-muted">
                    {{ wager.ownerEmail || wager.creatorName }} • {{ wager.participantCount }} participants • {{ wager.openSettlementCount }} open settlements
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
                    :to="`/wagers/${wager.slug}`"
                    color="primary"
                    variant="soft"
                    size="sm"
                    icon="i-lucide-arrow-right"
                  >
                    Open board
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
