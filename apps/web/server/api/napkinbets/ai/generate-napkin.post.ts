import { z } from 'zod'
import { createError, readBody } from 'h3'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
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
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await enforceRateLimit(event, 'ai-generate-napkin', 10, 60_000)

  const parsed = bodySchema.safeParse((await readBody(event)) ?? {})
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  return await generateNapkinBet(event, parsed.data)
})
