import { z } from 'zod'
import { defineUserMutation, withOptionalValidatedBody } from '#layer/server/utils/mutation'
import { generateNapkinBet } from '#server/services/napkinbets/ai'

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      }),
    )
    .min(1, 'Please provide at least one message.'),
  eventContext: z
    .object({
      eventTitle: z.string(),
      sport: z.string(),
      league: z.string(),
      homeTeamName: z.string().optional(),
      awayTeamName: z.string().optional(),
      venueName: z.string().optional(),
      startTime: z.string().optional(),
      status: z.string().optional(),
    })
    .optional(),
  friendNames: z.array(z.string()).max(50).optional(),
})

const RATE_LIMIT = { namespace: 'ai-generate-napkin', maxRequests: 10, windowMs: 60_000 }

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withOptionalValidatedBody(bodySchema.parse, {}),
  },
  async ({ event, body }) => generateNapkinBet(event, body),
)
