import { createError, getRouterParam } from 'h3'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { reverifyPaymentProfile } from '#server/services/napkinbets/payments'

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-verify-handle', 10, 60_000)

  const profileId = getRouterParam(event, 'id')
  if (!profileId) {
    throw createError({ statusCode: 400, message: 'Missing profile ID.' })
  }

  return await reverifyPaymentProfile(event, profileId)
})
