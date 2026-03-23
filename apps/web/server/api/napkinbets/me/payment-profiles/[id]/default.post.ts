import { createError, getRouterParam } from 'h3'
import { defineUserMutation } from '#layer/server/utils/mutation'
import { setDefaultUserPaymentProfile } from '#server/services/napkinbets/payments'

const RATE_LIMIT = {
  namespace: 'napkinbets-payment-profiles-default',
  maxRequests: 20,
  windowMs: 60_000,
}

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT,
  },
  async ({ event }) => {
  const profileId = getRouterParam(event, 'id')
  if (!profileId) {
    throw createError({ statusCode: 400, message: 'Missing payment profile ID.' })
  }

  return await setDefaultUserPaymentProfile(event, profileId)
  },
)
