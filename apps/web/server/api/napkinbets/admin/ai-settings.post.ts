import { defineAdminMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { z } from 'zod'
import { saveNapkinbetsAiSettings } from '#server/services/napkinbets/settings'

const bodySchema = z.object({
  aiRecommendationsEnabled: z.boolean(),
  aiPropSuggestionsEnabled: z.boolean(),
  aiTermsAssistEnabled: z.boolean(),
  aiCloseoutAssistEnabled: z.boolean(),
})

const RATE_LIMIT = {
  namespace: 'napkinbets-admin-ai-settings',
  maxRequests: 20,
  windowMs: 60_000,
}

export default defineAdminMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withValidatedBody(bodySchema.parse),
  },
  async ({ event, body }) => saveNapkinbetsAiSettings(event, body),
)
