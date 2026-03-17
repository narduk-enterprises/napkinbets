import { getRouterParam } from 'h3'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { removeNapkinbetsFriend } from '#server/services/napkinbets/social'

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-friends', 20, 60_000)

  const friendshipId = getRouterParam(event, 'id')
  if (!friendshipId) {
    throw createError({ statusCode: 400, message: 'Missing friendship id.' })
  }

  return await removeNapkinbetsFriend(event, friendshipId)
})
