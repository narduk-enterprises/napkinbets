import { RATE_LIMIT_POLICIES, enforceRateLimitPolicy } from '#layer/server/utils/rateLimit'
import { resolveDemoSessionUser } from '#server/utils/demo'

export default defineEventHandler(async (event) => {
  await enforceRateLimitPolicy(event, RATE_LIMIT_POLICIES.authLogin)
  const cleanUser = await resolveDemoSessionUser(event)

  await setUserSession(event, { user: cleanUser })

  return { user: cleanUser }
})
