import { getRouterParam } from 'h3'
import { defineUserMutation } from '#layer/server/utils/mutation'
import { removeNapkinbetsFriend } from '#server/services/napkinbets/social'

const RATE_LIMIT = { namespace: 'napkinbets-friends', maxRequests: 20, windowMs: 60_000 }

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT,
  },
  async ({ event }) => {
  const friendshipId = getRouterParam(event, 'id')
  if (!friendshipId) {
    throw createError({ statusCode: 400, message: 'Missing friendship id.' })
  }

  return await removeNapkinbetsFriend(event, friendshipId)
  },
)
