import { z } from 'zod'
import { defineUserMutation, withOptionalValidatedBody } from '#layer/server/utils/mutation'
import { suggestNapkinbetsLegs } from '#server/services/napkinbets/ai'

const bodySchema = z.object({
  title: z.string().min(1).max(200),
  format: z.string().max(40),
  existingLegs: z
    .array(z.object({ questionText: z.string() }))
    .max(50)
    .default([]),
  eventContext: z
    .object({
      eventTitle: z.string(),
      sport: z.string(),
      league: z.string(),
      homeTeamName: z.string().optional(),
      awayTeamName: z.string().optional(),
    })
    .optional(),
})

const RATE_LIMIT = { namespace: 'ai-suggest-legs', maxRequests: 10, windowMs: 60_000 }

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withOptionalValidatedBody(bodySchema.parse, {}),
  },
  async ({ event, body }) => {
    const legs = await suggestNapkinbetsLegs(event, body)
    return { legs }
  },
)
