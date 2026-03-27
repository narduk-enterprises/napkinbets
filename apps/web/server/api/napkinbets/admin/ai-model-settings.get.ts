import { loadNapkinbetsAiSettings } from '#server/services/napkinbets/settings'
import { grokListModels } from '#layer/server/utils/xai'

function buildChatModelCatalog(modelIds: string[]) {
  const chatModels = [...modelIds]
    .filter((id) => !id.includes('imagine') && !id.includes('image') && !id.includes('video'))
    .sort()

  return {
    chatModels,
    preferredChatModel: chatModels[0] ?? null,
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const aiSettings = await loadNapkinbetsAiSettings(event)

  let catalog = buildChatModelCatalog([])
  if (config.xaiApiKey) {
    try {
      const models = await grokListModels(config.xaiApiKey)
      catalog = buildChatModelCatalog(models.map((m) => m.id))
    } catch (err) {
      console.warn('[ai-model-settings] Could not fetch xAI models', err)
    }
  }

  return {
    currentModel: aiSettings.chatModel,
    ...catalog,
  }
})
