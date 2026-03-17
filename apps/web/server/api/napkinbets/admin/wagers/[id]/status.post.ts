import { eq } from 'drizzle-orm'
import { getRouterParam } from 'h3'
import { z } from 'zod'
import { requireAdmin } from '#layer/server/utils/auth'
import { napkinbetsWagers } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'

const bodySchema = z.object({
  status: z.enum(['open', 'locked', 'live', 'settling', 'settled', 'closed', 'archived']),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const wagerId = getRouterParam(event, 'id')
  if (!wagerId) {
    throw createError({ statusCode: 400, message: 'Missing wager ID.' })
  }

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  const db = useAppDatabase(event)
  await db
    .update(napkinbetsWagers)
    .set({
      status: parsed.data.status,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(napkinbetsWagers.id, wagerId))

  return { ok: true }
})
