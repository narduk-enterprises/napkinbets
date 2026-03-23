import { createError, getRouterParam } from 'h3'
import { defineAdminMutation } from '#layer/server/utils/mutation'
import { syncLeagueEntities } from '#server/services/napkinbets/entities'

const RATE_LIMIT = {
  namespace: 'napkinbets-admin-taxonomy-sync',
  maxRequests: 10,
  windowMs: 60_000,
}

export default defineAdminMutation(
  {
    rateLimit: RATE_LIMIT,
  },
  async ({ event }) => {
    const key = getRouterParam(event, 'key')
    if (!key) {
      throw createError({ statusCode: 400, message: 'Missing league key.' })
    }

    return await syncLeagueEntities(event, key)
  },
)
