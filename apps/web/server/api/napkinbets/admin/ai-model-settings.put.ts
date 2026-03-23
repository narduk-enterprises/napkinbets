import { z } from 'zod'
import { defineAdminMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { RATE_LIMIT_POLICIES } from '#layer/server/utils/rateLimit'
import { saveNapkinbetsChatModel } from '#server/services/napkinbets/settings'

const bodySchema = z.object({
  chatModel: z.string().min(1, 'Chat model must be selected'),
})

const RATE_LIMIT = RATE_LIMIT_POLICIES.adminAiModel

export default defineAdminMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withValidatedBody(bodySchema.parse),
  },
  async ({ event, body }) => saveNapkinbetsChatModel(event, body.chatModel),
)
