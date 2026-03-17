import { createError, getRouterParam } from 'h3'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { setDefaultUserPaymentProfile } from '#server/services/napkinbets/payments'

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-payment-profiles-default', 20, 60_000)

  const profileId = getRouterParam(event, 'id')
  if (!profileId) {
    throw createError({ statusCode: 400, message: 'Missing payment profile ID.' })
  }

  return await setDefaultUserPaymentProfile(event, profileId)
})
