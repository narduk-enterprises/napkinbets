import { eq } from 'drizzle-orm'
import { getRouterParam } from 'h3'
import { z } from 'zod'
import { requireAdmin } from '#layer/server/utils/auth'
import { users } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'

const bodySchema = z.object({
  isAdmin: z.boolean(),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const userId = getRouterParam(event, 'id')
  if (!userId) {
    throw createError({ statusCode: 400, message: 'Missing user ID.' })
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
    .update(users)
    .set({
      isAdmin: parsed.data.isAdmin,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId))

  return { ok: true }
})
