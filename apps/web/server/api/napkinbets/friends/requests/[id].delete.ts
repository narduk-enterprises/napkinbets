import { getRouterParam } from 'h3'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { declineNapkinbetsFriendRequest } from '#server/services/napkinbets/social'

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-friends', 20, 60_000)

  const requestId = getRouterParam(event, 'id')
  if (!requestId) {
    throw createError({ statusCode: 400, message: 'Missing request id.' })
  }

  return await declineNapkinbetsFriendRequest(event, requestId)
})
