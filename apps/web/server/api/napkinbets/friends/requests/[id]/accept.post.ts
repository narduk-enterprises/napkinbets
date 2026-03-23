import { getRouterParam } from 'h3'
import { defineUserMutation } from '#layer/server/utils/mutation'
import { acceptNapkinbetsFriendRequest } from '#server/services/napkinbets/social'

const RATE_LIMIT = { namespace: 'napkinbets-friends', maxRequests: 20, windowMs: 60_000 }

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT,
  },
  async ({ event }) => {
    const requestId = getRouterParam(event, 'id')
    if (!requestId) {
      throw createError({ statusCode: 400, message: 'Missing request id.' })
    }

    return await acceptNapkinbetsFriendRequest(event, requestId)
  },
)
