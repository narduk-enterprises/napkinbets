import { readBody } from 'h3'
import { z } from 'zod'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { createNapkinbetsGroup } from '#server/services/napkinbets/social'

const bodySchema = z.object({
  name: z.string().min(3).max(80),
  description: z.string().max(280).optional(),
  visibility: z.enum(['public', 'private']),
  joinPolicy: z.enum(['open', 'invite-only', 'closed']),
})

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-groups', 20, 60_000)

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  return await createNapkinbetsGroup(event, parsed.data)
})
