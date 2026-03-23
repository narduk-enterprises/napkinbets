import { eq } from 'drizzle-orm'
import { createError, getRouterParam } from 'h3'
import { z } from 'zod'
import { defineAdminMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { RATE_LIMIT_POLICIES } from '#layer/server/utils/rateLimit'
import { napkinbetsSystemPrompts } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'

const bodySchema = z.object({
  content: z.string().min(1),
})

const RATE_LIMIT = RATE_LIMIT_POLICIES.adminSystemPrompts ?? {
  namespace: 'admin-system-prompts',
  maxRequests: 10,
  windowMs: 60_000,
}

export default defineAdminMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withValidatedBody(bodySchema.parse),
  },
  async ({ event, body }) => {
    const name = getRouterParam(event, 'name')
    if (!name) {
      throw createError({ statusCode: 400, message: 'Missing system prompt name' })
    }

    const db = useAppDatabase(event)
    const now = new Date().toISOString()

    await db
      .update(napkinbetsSystemPrompts)
      .set({ content: body.content, updatedAt: now })
      .where(eq(napkinbetsSystemPrompts.name, name))
      .execute()

    return { success: true }
  },
)
