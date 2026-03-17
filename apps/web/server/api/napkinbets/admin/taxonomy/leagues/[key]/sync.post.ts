import { createError } from 'h3'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { requireAdmin } from '#layer/server/utils/auth'
import { syncLeagueEntities } from '#server/services/napkinbets/entities'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await enforceRateLimit(event, 'napkinbets-admin-taxonomy-sync', 10, 60_000)

  const key = getRouterParam(event, 'key')
  if (!key) {
    throw createError({ statusCode: 400, message: 'Missing league key.' })
  }

  return await syncLeagueEntities(event, key)
})
