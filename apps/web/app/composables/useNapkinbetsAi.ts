import type {
  NapkinbetsAiCloseoutSummaryInput,
  NapkinbetsAiTermsInput,
  NapkinbetsGeneratedNapkin,
  NapkinbetsAdminAiModelSettingsResponse,
  NapkinbetsSystemPromptEntry,
} from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

export function useNapkinbetsAi() {
  const api = useNapkinbetsApi()
  const { data: aiStatus } = useAsyncData<{ aiEnabled: boolean }>(
    'napkinbets-ai-status',
    () => useAppFetch()('/api/napkinbets/ai/status'),
    { default: () => ({ aiEnabled: false }) },
  )

  return {
    enabled: computed(() => aiStatus.value?.aiEnabled === true),
    rewriteTerms(payload: NapkinbetsAiTermsInput) {
      return api.rewriteTermsWithAi(payload)
    },
    draftCloseoutSummary(payload: NapkinbetsAiCloseoutSummaryInput) {
      return api.draftCloseoutSummary(payload)
    },
  }
}

export function useNapkinbetsAiGenerator() {
  const api = useNapkinbetsApi()
  const toast = useToast()
  const generating = ref(false)
  const result = ref<NapkinbetsGeneratedNapkin | null>(null)
  const error = ref<string | null>(null)
  const messages = ref<Array<{ role: 'user' | 'assistant'; content: string }>>([])

  async function generateNapkin(
    userPrompt: string,
    eventContext?: {
      eventTitle: string
      sport: string
      league: string
      homeTeamName?: string
      awayTeamName?: string
      venueName?: string
      startTime?: string
      status?: string
    },
  ) {
    if (!userPrompt.trim()) return null

    generating.value = true
    error.value = null
    result.value = null

    messages.value.push({ role: 'user', content: userPrompt })

    try {
      const napkin = await api.generateNapkin({
        messages: messages.value,
        eventContext,
      })
      result.value = napkin
      messages.value.push({
        role: 'assistant',
        content: JSON.stringify(napkin),
      })
      return napkin
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string }
      const msg = e.data?.message || e.message || 'Failed to generate napkin bet'
      error.value = msg
      toast.add({ title: 'AI Error', description: msg, color: 'error' })
      // Remove the last user message if it failed so they can try again
      messages.value.pop()
      return null
    } finally {
      generating.value = false
    }
  }

  function clear() {
    result.value = null
    error.value = null
    messages.value = []
  }

  return {
    generating,
    result,
    error,
    messages,
    generateNapkin,
    clear,
  }
}

export function useNapkinbetsAdminAi() {
  const api = useNapkinbetsApi()
  const toast = useToast()

  // Model settings
  const {
    data: modelSettings,
    status: modelStatus,
    refresh: refreshModels,
  } = useAsyncData<NapkinbetsAdminAiModelSettingsResponse>('admin-ai-model-settings', () =>
    api.getAdminAiModelSettings(),
  )

  const savingModel = ref(false)

  async function saveChatModel(model: string) {
    savingModel.value = true
    try {
      await api.saveAdminChatModel(model)
      toast.add({ title: 'Saved', description: 'Chat model updated', color: 'success' })
      await refreshModels()
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string }
      toast.add({
        title: 'Error',
        description: e.data?.message || e.message || 'Failed to save model',
        color: 'error',
      })
    } finally {
      savingModel.value = false
    }
  }

  // System prompts
  const {
    data: systemPrompts,
    status: promptsStatus,
    refresh: refreshPrompts,
  } = useAsyncData<NapkinbetsSystemPromptEntry[]>('admin-system-prompts', () =>
    api.getAdminSystemPrompts(),
  )

  const savingPrompt = ref(false)

  async function updatePrompt(name: string, content: string) {
    savingPrompt.value = true
    try {
      await api.updateAdminSystemPrompt(name, content)
      toast.add({ title: 'Success', description: 'System prompt updated', color: 'success' })
      await refreshPrompts()
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string }
      toast.add({
        title: 'Error',
        description: e.data?.message || e.message || 'Failed to update prompt',
        color: 'error',
      })
    } finally {
      savingPrompt.value = false
    }
  }

  return {
    modelSettings,
    modelStatus,
    refreshModels,
    savingModel,
    saveChatModel,
    systemPrompts,
    promptsStatus,
    refreshPrompts,
    savingPrompt,
    updatePrompt,
  }
}
