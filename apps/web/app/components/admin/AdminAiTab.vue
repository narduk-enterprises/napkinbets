<script setup lang="ts">
const admin = useNapkinbetsAdminAi()
const adminState = await useNapkinbetsAdmin()
const actions = useNapkinbetsActions(adminState.refresh)
const adminData = computed(() => adminState.data.value)

// ─── Model selector ────────────────────────────────────────
const selectedModel = ref('')

watch(
  () => admin.modelSettings.value?.currentModel,
  (val) => {
    if (val && !selectedModel.value) selectedModel.value = val
  },
  { immediate: true },
)

const modelOptions = computed(() =>
  (admin.modelSettings.value?.chatModels ?? []).map((id: string) => ({
    label: id,
    value: id,
  })),
)

async function saveModel() {
  if (!selectedModel.value) return
  await admin.saveChatModel(selectedModel.value)
}

// ─── System prompt editor ──────────────────────────────────
const editingPrompt = ref<string | null>(null)
const editContent = ref('')

function startEditing(name: string, content: string) {
  editingPrompt.value = name
  editContent.value = content
}

function cancelEditing() {
  editingPrompt.value = null
  editContent.value = ''
}

async function savePrompt() {
  if (!editingPrompt.value) return
  await admin.updatePrompt(editingPrompt.value, editContent.value)
  editingPrompt.value = null
  editContent.value = ''
}

// ─── AI toggle controls (moved from DashboardTab) ──────────
async function updateAiSettings(
  key:
    | 'aiRecommendationsEnabled'
    | 'aiPropSuggestionsEnabled'
    | 'aiTermsAssistEnabled'
    | 'aiCloseoutAssistEnabled',
) {
  const current = adminData.value.aiSettings
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
    enabled: adminData.value.aiSettings.aiRecommendationsEnabled,
  },
  {
    key: 'aiPropSuggestionsEnabled' as const,
    label: 'Prop suggestion assists',
    description:
      'Lets Events and create flows ask for grounded prop variants from live event context.',
    enabled: adminData.value.aiSettings.aiPropSuggestionsEnabled,
  },
  {
    key: 'aiTermsAssistEnabled' as const,
    label: 'Terms rewrite assists',
    description:
      'Lets hosts tighten house rules and settle-up wording without changing the stake logic.',
    enabled: adminData.value.aiSettings.aiTermsAssistEnabled,
  },
  {
    key: 'aiCloseoutAssistEnabled' as const,
    label: 'Closeout summary assists',
    description:
      'Lets owners generate a cleaner reconciliation summary once proof and outcomes are in.',
    enabled: adminData.value.aiSettings.aiCloseoutAssistEnabled,
  },
])

function formatPromptName(name: string) {
  return name
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Provider Status -->
    <UCard class="napkinbets-panel">
      <div class="space-y-4">
        <div class="space-y-2">
          <p class="napkinbets-kicker">Provider Status</p>
          <h2 class="napkinbets-subsection-title">AI engine configuration</h2>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <UAlert
            :color="adminData.aiSettings.xaiConfigured ? 'success' : 'warning'"
            variant="soft"
            :icon="adminData.aiSettings.xaiConfigured ? 'i-lucide-bot' : 'i-lucide-key-round'"
            :title="
              adminData.aiSettings.xaiConfigured
                ? 'Grok provider configured'
                : 'XAI_API_KEY not configured'
            "
            :description="
              adminData.aiSettings.xaiConfigured
                ? 'Model selection and system prompts are available below.'
                : 'Keep all AI flags off until the provider key is available in Doppler.'
            "
          />

          <UAlert
            :color="adminData.aiSettings.theSportsDbConfigured ? 'success' : 'warning'"
            variant="soft"
            :icon="
              adminData.aiSettings.theSportsDbConfigured
                ? 'i-lucide-database'
                : 'i-lucide-key-round'
            "
            :title="
              adminData.aiSettings.theSportsDbConfigured
                ? 'TheSportsDB provider configured'
                : 'TSDB key not configured'
            "
            :description="
              adminData.aiSettings.theSportsDbConfigured
                ? 'Reference sync and asset retrieval tasks are available.'
                : 'Check Doppler for THE_SPORTS_DB_API_KEY.'
            "
          />
        </div>
      </div>
    </UCard>

    <!-- Model Selection -->
    <UCard class="napkinbets-panel">
      <div class="space-y-4">
        <div class="space-y-2">
          <p class="napkinbets-kicker">Model Configuration</p>
          <h2 class="napkinbets-subsection-title">Default Grok chat model</h2>
          <p class="text-sm text-muted">
            Select the default xAI model used for all AI assists (napkin generation, terms rewrite,
            closeout summaries).
          </p>
        </div>

        <div v-if="admin.modelStatus.value === 'pending'" class="flex items-center gap-2">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-muted" />
          <span class="text-sm text-muted">Loading available models...</span>
        </div>

        <div v-else class="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div class="w-full sm:w-80">
            <USelect
              v-model="selectedModel"
              :items="modelOptions"
              placeholder="Select a model"
              class="w-full"
              value-key="value"
            />
          </div>
          <UButton
            color="primary"
            :loading="admin.savingModel.value"
            :disabled="!selectedModel || selectedModel === admin.modelSettings.value?.currentModel"
            icon="i-lucide-save"
            @click="saveModel"
          >
            Save Model
          </UButton>
        </div>

        <p v-if="admin.modelSettings.value?.currentModel" class="text-xs text-dimmed">
          Current:
          <span class="font-mono">{{ admin.modelSettings.value.currentModel }}</span>
        </p>
      </div>
    </UCard>

    <!-- AI Feature Toggles -->
    <UCard class="napkinbets-panel">
      <div class="space-y-4">
        <div class="space-y-2">
          <p class="napkinbets-kicker">Feature Flags</p>
          <h2 class="napkinbets-subsection-title">AI assist controls</h2>
        </div>

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

    <!-- System Prompts -->
    <UCard class="napkinbets-panel">
      <div class="space-y-4">
        <div class="space-y-2">
          <p class="napkinbets-kicker">System Prompts</p>
          <h2 class="napkinbets-subsection-title">Editable AI instructions</h2>
          <p class="text-sm text-muted">
            These prompts guide Grok's behavior in each AI assist. Edit them to customize how
            napkins are generated, terms are rewritten, and closeout summaries are drafted.
          </p>
        </div>

        <div v-if="admin.promptsStatus.value === 'pending'" class="flex items-center gap-2">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-muted" />
          <span class="text-sm text-muted">Loading system prompts...</span>
        </div>

        <div v-else-if="(admin.systemPrompts.value ?? []).length > 0" class="space-y-3">
          <UCard
            v-for="prompt in admin.systemPrompts.value ?? []"
            :key="prompt.name"
            class="napkinbets-panel"
          >
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="space-y-1">
                  <p class="font-semibold text-default">
                    {{ formatPromptName(prompt.name) }}
                  </p>
                  <p class="text-xs text-muted">{{ prompt.description }}</p>
                </div>
                <UButton
                  v-if="editingPrompt !== prompt.name"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="i-lucide-pencil"
                  @click="startEditing(prompt.name, prompt.content)"
                >
                  Edit
                </UButton>
              </div>

              <template v-if="editingPrompt === prompt.name">
                <UTextarea
                  v-model="editContent"
                  :rows="12"
                  autoresize
                  class="w-full font-mono text-xs"
                />
                <div class="flex gap-2 justify-end">
                  <UButton color="neutral" variant="ghost" size="xs" @click="cancelEditing">
                    Cancel
                  </UButton>
                  <UButton
                    color="primary"
                    size="xs"
                    :loading="admin.savingPrompt.value"
                    icon="i-lucide-save"
                    @click="savePrompt"
                  >
                    Save
                  </UButton>
                </div>
              </template>

              <template v-else>
                <pre
                  class="text-xs text-muted whitespace-pre-wrap wrap-break-word max-h-32 overflow-y-auto bg-muted rounded-lg p-3"
                  >{{ prompt.content }}</pre
                >
                <p class="text-xs text-dimmed">
                  Updated: {{ new Date(prompt.updatedAt).toLocaleString() }}
                </p>
              </template>
            </div>
          </UCard>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-default bg-elevated/50 py-12 text-center"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
          >
            <UIcon name="i-lucide-file-text" class="h-6 w-6" />
          </div>
          <p class="text-sm font-medium text-default">No system prompts loaded</p>
          <p class="max-w-sm text-xs text-muted">
            Configure the AI provider in Doppler to load editable prompts for napkin generation,
            terms rewrite, and closeout summaries.
          </p>
        </div>
      </div>
    </UCard>

    <!-- AI activity (empty state when no run history) -->
    <UCard class="napkinbets-panel">
      <div class="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted"
        >
          <UIcon name="i-lucide-sparkles" class="h-6 w-6" />
        </div>
        <p class="text-sm font-medium text-default">No AI runs yet</p>
        <p class="max-w-sm text-xs text-muted">
          When users trigger AI assists (recommendations, prop suggestions, terms rewrite, or
          closeout summaries), runs will appear here.
        </p>
      </div>
    </UCard>
  </div>
</template>
