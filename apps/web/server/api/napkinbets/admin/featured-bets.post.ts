import { z } from 'zod'
import { requireAdmin } from '#layer/server/utils/auth'
import { napkinbetsFeaturedBets } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import { eq } from 'drizzle-orm'

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

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? 'Invalid input',
    })
  }

  const db = useAppDatabase(event)
  const now = new Date().toISOString()
  const data = parsed.data

  if (data.id) {
    const existing = await db
      .select()
      .from(napkinbetsFeaturedBets)
      .where(eq(napkinbetsFeaturedBets.id, data.id))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(napkinbetsFeaturedBets)
        .set({
          label: data.label,
          title: data.title,
          subtitle: data.subtitle,
          summary: data.summary,
          windowLabel: data.windowLabel,
          venueLabel: data.venueLabel,
          accent: data.accent,
          imageUrl: data.imageUrl,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
          prefillJson: data.prefillJson,
          updatedAt: now,
        })
        .where(eq(napkinbetsFeaturedBets.id, data.id))

      return { ok: true, id: data.id }
    }
  }

  const id = data.id || crypto.randomUUID()

  await db.insert(napkinbetsFeaturedBets).values({
    id,
    label: data.label,
    title: data.title,
    subtitle: data.subtitle,
    summary: data.summary,
    windowLabel: data.windowLabel,
    venueLabel: data.venueLabel,
    accent: data.accent,
    imageUrl: data.imageUrl,
    sortOrder: data.sortOrder,
    isActive: data.isActive,
    prefillJson: data.prefillJson,
    createdAt: now,
    updatedAt: now,
  })

  return { ok: true, id }
})
