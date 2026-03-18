import { z } from 'zod'
import { createError, readBody } from 'h3'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
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

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await enforceRateLimit(event, 'ai-suggest-legs', 10, 60_000)

  const parsed = bodySchema.safeParse((await readBody(event)) ?? {})
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  const legs = await suggestNapkinbetsLegs(event, parsed.data)
  return { legs }
})
