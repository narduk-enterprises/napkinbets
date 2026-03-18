import { requireAdmin } from '#layer/server/utils/auth'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { napkinbetsWagers } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import { eq } from 'drizzle-orm'
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

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await enforceRateLimit(event, 'admin-wager-update', 20, 60_000)

  const db = useAppDatabase(event)
  const wagerId = event.context.params?.id

  if (!wagerId) {
    throw createError({ statusCode: 400, message: 'Missing wager ID' })
  }

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((i) => i.message).join(', '),
    })
  }

  if (Object.keys(parsed.data).length === 0) {
    return { success: true }
  }

  await db
    .update(napkinbetsWagers)
    .set({
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(napkinbetsWagers.id, wagerId))

  return { success: true }
})
