import { requireAdmin } from '#layer/server/utils/auth'
import { napkinbetsFeaturedBets } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import { asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const db = useAppDatabase(event)
  const rows = await db
    .select()
    .from(napkinbetsFeaturedBets)
    .orderBy(asc(napkinbetsFeaturedBets.sortOrder))

  return {
    featuredBets: rows.map((row) => ({
      id: row.id,
      label: row.label,
      title: row.title,
      subtitle: row.subtitle,
      summary: row.summary,
      windowLabel: row.windowLabel,
      venueLabel: row.venueLabel,
      accent: row.accent,
      imageUrl: row.imageUrl,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      prefillJson: row.prefillJson,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })),
  }
})
