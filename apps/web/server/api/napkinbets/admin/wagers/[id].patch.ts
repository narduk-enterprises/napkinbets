import { defineAdminMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { napkinbetsWagers } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import { eq } from 'drizzle-orm'
import { createError } from 'h3'
import { z } from 'zod'

const bodySchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  status: z
    .enum([
      'open',
      'locked',
      'calling',
      'disputed',
      'live',
      'settling',
      'settled',
      'closed',
      'archived',
    ])
    .optional(),
  league: z.string().max(40).optional(),
  eventTitle: z.string().max(160).optional(),
  slug: z.string().max(120).optional(),
})

const RATE_LIMIT = { namespace: 'admin-wager-update', maxRequests: 20, windowMs: 60_000 }

export default defineAdminMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withValidatedBody(bodySchema.parse),
  },
  async ({ event, body }) => {
    const db = useAppDatabase(event)
    const wagerId = event.context.params?.id

    if (!wagerId) {
      throw createError({ statusCode: 400, message: 'Missing wager ID' })
    }

    if (Object.keys(body).length === 0) {
      return { success: true }
    }

    await db
      .update(napkinbetsWagers)
      .set({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(napkinbetsWagers.id, wagerId))

    return { success: true }
  },
)
