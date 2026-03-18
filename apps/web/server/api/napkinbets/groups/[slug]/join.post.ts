import { getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { napkinbetsGroups } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import { joinNapkinbetsGroup } from '#server/services/napkinbets/social'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-groups', 20, 60_000)

  const slugOrId = getRouterParam(event, 'slug')
  if (!slugOrId) {
    throw createError({ statusCode: 400, message: 'Missing group slug or id.' })
  }

  const db = useAppDatabase(event)
  const group = await db
    .select({ id: napkinbetsGroups.id })
    .from(napkinbetsGroups)
    .where(
      UUID_REGEX.test(slugOrId)
        ? eq(napkinbetsGroups.id, slugOrId)
        : eq(napkinbetsGroups.slug, slugOrId),
    )
    .get()

  if (!group) {
    throw createError({ statusCode: 404, message: 'Group not found.' })
  }

  return await joinNapkinbetsGroup(event, group.id)
})
