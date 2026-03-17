import { createError, getRouterParam } from 'h3'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { removeUserPaymentProfile } from '#server/services/napkinbets/payments'

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-payment-profiles-delete', 20, 60_000)

  const profileId = getRouterParam(event, 'id')
  if (!profileId) {
    throw createError({ statusCode: 400, message: 'Missing payment profile ID.' })
  }

  return await removeUserPaymentProfile(event, profileId)
})
