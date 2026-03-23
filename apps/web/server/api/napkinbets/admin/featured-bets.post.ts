import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { defineAdminMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { napkinbetsFeaturedBets } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'

const schema = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().default(''),
  summary: z.string().default(''),
  windowLabel: z.string().default(''),
  venueLabel: z.string().default(''),
  accent: z.enum(['major', 'tour', 'watch']).default('tour'),
  imageUrl: z.string().default(''),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  prefillJson: z.string().default('{}'),
})

const RATE_LIMIT = {
  namespace: 'admin-featured-bets',
  maxRequests: 10,
  windowMs: 60_000,
}

export default defineAdminMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withValidatedBody(schema.parse),
  },
  async ({ event, body }) => {
    const db = useAppDatabase(event)
    const now = new Date().toISOString()

    if (body.id) {
      const existing = await db
        .select()
        .from(napkinbetsFeaturedBets)
        .where(eq(napkinbetsFeaturedBets.id, body.id))
        .limit(1)

      if (existing.length > 0) {
        await db
          .update(napkinbetsFeaturedBets)
          .set({
            label: body.label,
            title: body.title,
            subtitle: body.subtitle,
            summary: body.summary,
            windowLabel: body.windowLabel,
            venueLabel: body.venueLabel,
            accent: body.accent,
            imageUrl: body.imageUrl,
            sortOrder: body.sortOrder,
            isActive: body.isActive,
            prefillJson: body.prefillJson,
            updatedAt: now,
          })
          .where(eq(napkinbetsFeaturedBets.id, body.id))

        return { ok: true, id: body.id }
      }
    }

    const id = body.id || crypto.randomUUID()

    await db.insert(napkinbetsFeaturedBets).values({
      id,
      label: body.label,
      title: body.title,
      subtitle: body.subtitle,
      summary: body.summary,
      windowLabel: body.windowLabel,
      venueLabel: body.venueLabel,
      accent: body.accent,
      imageUrl: body.imageUrl,
      sortOrder: body.sortOrder,
      isActive: body.isActive,
      prefillJson: body.prefillJson,
      createdAt: now,
      updatedAt: now,
    })

    return { ok: true, id }
  },
)
