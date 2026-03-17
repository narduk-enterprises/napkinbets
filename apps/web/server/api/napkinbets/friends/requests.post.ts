import { readBody } from 'h3'
import { z } from 'zod'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { sendNapkinbetsFriendRequest } from '#server/services/napkinbets/social'

const bodySchema = z.object({
  targetUserId: z.string().min(1).max(120),
})

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-friends', 20, 60_000)

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  return await sendNapkinbetsFriendRequest(event, parsed.data.targetUserId)
})
