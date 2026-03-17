import { getRouterParam } from 'h3'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { joinNapkinbetsGroup } from '#server/services/napkinbets/social'

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-groups', 20, 60_000)

  const groupId = getRouterParam(event, 'id')
  if (!groupId) {
    throw createError({ statusCode: 400, message: 'Missing group id.' })
  }

  return await joinNapkinbetsGroup(event, groupId)
})
