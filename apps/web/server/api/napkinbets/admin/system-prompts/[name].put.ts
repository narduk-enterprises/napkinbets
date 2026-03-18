import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '#layer/server/utils/auth'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { napkinbetsSystemPrompts } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'

const bodySchema = z.object({
  content: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await enforceRateLimit(event, 'admin-system-prompts', 10, 60_000)

  const name = getRouterParam(event, 'name')
  if (!name) {
    throw createError({ statusCode: 400, message: 'Missing system prompt name' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)
  const db = useAppDatabase(event)
  const now = new Date().toISOString()

  await db
    .update(napkinbetsSystemPrompts)
    .set({ content: body.content, updatedAt: now })
    .where(eq(napkinbetsSystemPrompts.name, name))
    .execute()

  return { success: true }
})
