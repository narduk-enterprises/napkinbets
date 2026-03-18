import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { resolveDemoSessionUser } from '#server/utils/demo'

/** Demo login is hit often by e2e; use a higher limit than authLogin. */
const DEMO_RATE_LIMIT = { namespace: 'auth-demo', maxRequests: 300, windowMs: 60_000 }

export default defineEventHandler(async (event) => {
  await enforceRateLimit(
    event,
    DEMO_RATE_LIMIT.namespace,
    DEMO_RATE_LIMIT.maxRequests,
    DEMO_RATE_LIMIT.windowMs,
  )
  const cleanUser = await resolveDemoSessionUser(event)

  await setUserSession(event, { user: cleanUser })

  return { user: cleanUser }
})
