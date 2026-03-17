import { createError, readBody } from 'h3'
import { z } from 'zod'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { requireAdmin } from '#layer/server/utils/auth'
import { saveNapkinbetsAiSettings } from '#server/services/napkinbets/settings'

const bodySchema = z.object({
  aiRecommendationsEnabled: z.boolean(),
  aiPropSuggestionsEnabled: z.boolean(),
  aiTermsAssistEnabled: z.boolean(),
  aiCloseoutAssistEnabled: z.boolean(),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await enforceRateLimit(event, 'napkinbets-admin-ai-settings', 20, 60_000)

  const parsed = bodySchema.safeParse((await readBody(event)) ?? {})
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  return await saveNapkinbetsAiSettings(event, parsed.data)
})
