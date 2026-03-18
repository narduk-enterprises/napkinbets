import { requireAdmin } from '#layer/server/utils/auth'
import {
  loadNapkinbetsAiSettings,
  saveNapkinbetsChatModel,
} from '#server/services/napkinbets/settings'
import { z } from 'zod'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'

const bodySchema = z.object({
  chatModel: z.string().min(1, 'Chat model must be selected'),
})

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
  const method = getMethod(event)
  await requireAdmin(event)

  if (method === 'GET') {
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
  }

  // PUT
  await enforceRateLimit(event, 'admin-ai-model', 10, 60_000)
  const body = await readValidatedBody(event, bodySchema.parse)
  return await saveNapkinbetsChatModel(event, body.chatModel)
})
