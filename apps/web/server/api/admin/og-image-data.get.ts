import { desc, eq } from 'drizzle-orm'
import { useAppDatabase } from '#server/utils/database'
import { napkinbetsWagers, napkinbetsGroups, napkinbetsEvents } from '../../database/schema'

/**
 * Returns real wagers, groups, and events from the database
 * for the admin OG image preview tab. Limits to the most recent
 * items so the preview stays relevant.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useAppDatabase(event)

  const [wagers, groups, events] = await Promise.all([
    db
      .select({
        slug: napkinbetsWagers.slug,
        title: napkinbetsWagers.title,
        status: napkinbetsWagers.status,
        napkinType: napkinbetsWagers.napkinType,
      })
      .from(napkinbetsWagers)
      .orderBy(desc(napkinbetsWagers.createdAt))
      .limit(6),

    db
      .select({
        slug: napkinbetsGroups.slug,
        name: napkinbetsGroups.name,
        visibility: napkinbetsGroups.visibility,
      })
      .from(napkinbetsGroups)
      .orderBy(desc(napkinbetsGroups.createdAt))
      .limit(4),

    db
      .select({
        id: napkinbetsEvents.id,
        eventTitle: napkinbetsEvents.eventTitle,
        sport: napkinbetsEvents.sport,
        state: napkinbetsEvents.state,
      })
      .from(napkinbetsEvents)
      .where(eq(napkinbetsEvents.state, 'pre'))
      .orderBy(desc(napkinbetsEvents.startTime))
      .limit(4),
  ])

  return { wagers, groups, events }
})
